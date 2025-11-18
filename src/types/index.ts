export interface Participant {
  firstName: string;
  lastName: string;
}

export interface FormationData {
  participants: Participant[];
  formationName: string;
  startDate: string;
  endDate: string;
}
