/* eslint-disable */
import type { Prisma, Application, InterviewStage, ApplicationHistory } from "@prisma/client";
import type { PothosPrismaDatamodel } from "@pothos/plugin-prisma";
export default interface PrismaTypes {
    Application: {
        Name: "Application";
        Shape: Application;
        Include: Prisma.ApplicationInclude;
        Select: Prisma.ApplicationSelect;
        OrderBy: Prisma.ApplicationOrderByWithRelationInput;
        WhereUnique: Prisma.ApplicationWhereUniqueInput;
        Where: Prisma.ApplicationWhereInput;
        Create: {};
        Update: {};
        RelationName: "interviewStages" | "history";
        ListRelations: "interviewStages" | "history";
        Relations: {
            interviewStages: {
                Shape: InterviewStage[];
                Name: "InterviewStage";
                Nullable: false;
            };
            history: {
                Shape: ApplicationHistory[];
                Name: "ApplicationHistory";
                Nullable: false;
            };
        };
    };
    InterviewStage: {
        Name: "InterviewStage";
        Shape: InterviewStage;
        Include: Prisma.InterviewStageInclude;
        Select: Prisma.InterviewStageSelect;
        OrderBy: Prisma.InterviewStageOrderByWithRelationInput;
        WhereUnique: Prisma.InterviewStageWhereUniqueInput;
        Where: Prisma.InterviewStageWhereInput;
        Create: {};
        Update: {};
        RelationName: "application";
        ListRelations: never;
        Relations: {
            application: {
                Shape: Application;
                Name: "Application";
                Nullable: false;
            };
        };
    };
    ApplicationHistory: {
        Name: "ApplicationHistory";
        Shape: ApplicationHistory;
        Include: Prisma.ApplicationHistoryInclude;
        Select: Prisma.ApplicationHistorySelect;
        OrderBy: Prisma.ApplicationHistoryOrderByWithRelationInput;
        WhereUnique: Prisma.ApplicationHistoryWhereUniqueInput;
        Where: Prisma.ApplicationHistoryWhereInput;
        Create: {};
        Update: {};
        RelationName: "application";
        ListRelations: never;
        Relations: {
            application: {
                Shape: Application;
                Name: "Application";
                Nullable: false;
            };
        };
    };
}
export function getDatamodel(): PothosPrismaDatamodel;