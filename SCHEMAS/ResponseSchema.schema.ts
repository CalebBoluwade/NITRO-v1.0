export interface ResponseSchema {
  statusCode: number;
  status: string;
  results: number;
  data: string | any[] | null;
}
