import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const formData = await req.formData();
    const pptxFile = formData.get('file') as File;

    if (!pptxFile) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const cloudConvertApiKey = Deno.env.get('CLOUDCONVERT_API_KEY');

    if (!cloudConvertApiKey) {
      return new Response(
        JSON.stringify({ error: 'CloudConvert API key not configured. Please add CLOUDCONVERT_API_KEY to your Supabase secrets.' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const createJobResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cloudConvertApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tasks: {
          'upload-file': {
            operation: 'import/upload',
          },
          'convert-file': {
            operation: 'convert',
            input: 'upload-file',
            output_format: 'pdf',
          },
          'export-file': {
            operation: 'export/url',
            input: 'convert-file',
          },
        },
      }),
    });

    if (!createJobResponse.ok) {
      const error = await createJobResponse.text();
      console.error('CloudConvert job creation failed:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create conversion job' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const jobData = await createJobResponse.json();
    const uploadTask = jobData.data.tasks.find((t: any) => t.name === 'upload-file');

    const uploadFormData = new FormData();
    uploadFormData.append('file', pptxFile);

    const uploadResponse = await fetch(uploadTask.result.form.url, {
      method: 'POST',
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('File upload failed:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    let jobStatus;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobData.data.id}`, {
        headers: {
          'Authorization': `Bearer ${cloudConvertApiKey}`,
        },
      });

      jobStatus = await statusResponse.json();

      if (jobStatus.data.status === 'finished') {
        break;
      } else if (jobStatus.data.status === 'error') {
        console.error('Conversion failed:', jobStatus);
        return new Response(
          JSON.stringify({ error: 'Conversion failed' }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      return new Response(
        JSON.stringify({ error: 'Conversion timeout' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const exportTask = jobStatus.data.tasks.find((t: any) => t.name === 'export-file');
    const pdfUrl = exportTask.result.files[0].url;

    const pdfResponse = await fetch(pdfUrl);
    const pdfBlob = await pdfResponse.blob();

    return new Response(pdfBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
      },
    });
  } catch (error) {
    console.error('Error in convert-pptx-to-pdf:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});