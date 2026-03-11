import { builder } from './builder.js';
import { ApplicationStatus, CompanyCategory, JobSource } from '@prisma/client';

export const ApplicationStatusEnum = builder.enumType(ApplicationStatus, { name: 'ApplicationStatus' });
export const CompanyCategoryEnum = builder.enumType(CompanyCategory, { name: 'CompanyCategory' });
export const JobSourceEnum = builder.enumType(JobSource, { name: 'JobSource' });
