export enum ReportType {
    Observer = 'Observer',
    Mentor = 'Mentor',
    Tv = 'Tv',
    Self = 'Self',
}

export const gradeDtoRegex = /^(\d{1,2}(\.\d)?)(\/(\d{1,2}(\.\d)?))?$/;

export const mixedGradeRegex = /^(\d{1,2}(\.\d)?)(\/(\d{1,2}(\.\d)?))$/;

export const simpleGradeRegex = /^(\d{1,2}(\.\d)?)$/;
