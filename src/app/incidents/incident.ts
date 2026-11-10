export interface Incident {
  id: string;
  title: string;
  zone: string;
  severity: 'low' | 'medium' | 'critical';
}
