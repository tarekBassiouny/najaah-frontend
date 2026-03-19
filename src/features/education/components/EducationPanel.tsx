"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { GradesTable } from "@/features/education/components/GradesTable";
import { GradeFormDialog } from "@/features/education/components/GradeFormDialog";
import { DeleteGradeDialog } from "@/features/education/components/DeleteGradeDialog";
import { SchoolsTable } from "@/features/education/components/SchoolsTable";
import { SchoolFormDialog } from "@/features/education/components/SchoolFormDialog";
import { DeleteSchoolDialog } from "@/features/education/components/DeleteSchoolDialog";
import { CollegesTable } from "@/features/education/components/CollegesTable";
import { CollegeFormDialog } from "@/features/education/components/CollegeFormDialog";
import { DeleteCollegeDialog } from "@/features/education/components/DeleteCollegeDialog";
import type {
  College,
  Grade,
  School,
} from "@/features/education/types/education";
import { useTranslation } from "@/features/localization";
import { cn } from "@/lib/utils";

type EducationTab = "grades" | "schools" | "colleges";

type EducationPanelProps = {
  centerId: string | number;
};

export function EducationPanel({ centerId }: EducationPanelProps) {
  const { t, locale } = useTranslation();
  const [activeTab, setActiveTab] = useState<EducationTab>("grades");
  const [feedback, setFeedback] = useState<string | null>(null);
  const isRtl = locale === "ar";

  const tabs: Array<{
    key: EducationTab;
    label: string;
    description: string;
    createLabel: string;
  }> = [
    {
      key: "grades",
      label: t("pages.education.panel.tabs.grades.label"),
      description: t("pages.education.panel.tabs.grades.description"),
      createLabel: t("pages.education.panel.tabs.grades.createLabel"),
    },
    {
      key: "schools",
      label: t("pages.education.panel.tabs.schools.label"),
      description: t("pages.education.panel.tabs.schools.description"),
      createLabel: t("pages.education.panel.tabs.schools.createLabel"),
    },
    {
      key: "colleges",
      label: t("pages.education.panel.tabs.colleges.label"),
      description: t("pages.education.panel.tabs.colleges.description"),
      createLabel: t("pages.education.panel.tabs.colleges.createLabel"),
    },
  ];

  const [isGradeFormOpen, setIsGradeFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [deletingGrade, setDeletingGrade] = useState<Grade | null>(null);

  const [isSchoolFormOpen, setIsSchoolFormOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [deletingSchool, setDeletingSchool] = useState<School | null>(null);

  const [isCollegeFormOpen, setIsCollegeFormOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [deletingCollege, setDeletingCollege] = useState<College | null>(null);

  const activeTabConfig = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];

  const handleCreate = () => {
    setFeedback(null);

    if (activeTab === "grades") {
      setEditingGrade(null);
      setIsGradeFormOpen(true);
      return;
    }

    if (activeTab === "schools") {
      setEditingSchool(null);
      setIsSchoolFormOpen(true);
      return;
    }

    setEditingCollege(null);
    setIsCollegeFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                className={cn(
                  "rounded-lg px-3 py-2 transition-colors",
                  isRtl ? "text-right" : "text-left",
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
                )}
                onClick={() => {
                  setActiveTab(tab.key);
                  setFeedback(null);
                }}
              >
                <p className="text-sm font-medium">{tab.label}</p>
                <p
                  className={cn(
                    "mt-0.5 text-xs",
                    isActive
                      ? "text-white/85"
                      : "text-gray-500 dark:text-gray-400",
                  )}
                >
                  {tab.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Button onClick={handleCreate}>{activeTabConfig.createLabel}</Button>
      </div>

      {feedback ? (
        <Alert variant="success">
          <AlertTitle>{t("pages.education.panel.successTitle")}</AlertTitle>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      ) : null}

      {activeTab === "grades" ? (
        <GradesTable
          centerId={centerId}
          onEdit={(grade) => {
            setFeedback(null);
            setEditingGrade(grade);
            setIsGradeFormOpen(true);
          }}
          onDelete={(grade) => {
            setFeedback(null);
            setDeletingGrade(grade);
          }}
        />
      ) : null}

      {activeTab === "schools" ? (
        <SchoolsTable
          centerId={centerId}
          onEdit={(school) => {
            setFeedback(null);
            setEditingSchool(school);
            setIsSchoolFormOpen(true);
          }}
          onDelete={(school) => {
            setFeedback(null);
            setDeletingSchool(school);
          }}
        />
      ) : null}

      {activeTab === "colleges" ? (
        <CollegesTable
          centerId={centerId}
          onEdit={(college) => {
            setFeedback(null);
            setEditingCollege(college);
            setIsCollegeFormOpen(true);
          }}
          onDelete={(college) => {
            setFeedback(null);
            setDeletingCollege(college);
          }}
        />
      ) : null}

      <GradeFormDialog
        centerId={centerId}
        open={isGradeFormOpen}
        onOpenChange={(open) => {
          setIsGradeFormOpen(open);
          if (!open) setEditingGrade(null);
        }}
        grade={editingGrade}
        onSuccess={(message) => setFeedback(message)}
      />

      <DeleteGradeDialog
        centerId={centerId}
        open={Boolean(deletingGrade)}
        onOpenChange={(open) => {
          if (!open) setDeletingGrade(null);
        }}
        grade={deletingGrade}
        onSuccess={(message) => setFeedback(message)}
      />

      <SchoolFormDialog
        centerId={centerId}
        open={isSchoolFormOpen}
        onOpenChange={(open) => {
          setIsSchoolFormOpen(open);
          if (!open) setEditingSchool(null);
        }}
        school={editingSchool}
        onSuccess={(message) => setFeedback(message)}
      />

      <DeleteSchoolDialog
        centerId={centerId}
        open={Boolean(deletingSchool)}
        onOpenChange={(open) => {
          if (!open) setDeletingSchool(null);
        }}
        school={deletingSchool}
        onSuccess={(message) => setFeedback(message)}
      />

      <CollegeFormDialog
        centerId={centerId}
        open={isCollegeFormOpen}
        onOpenChange={(open) => {
          setIsCollegeFormOpen(open);
          if (!open) setEditingCollege(null);
        }}
        college={editingCollege}
        onSuccess={(message) => setFeedback(message)}
      />

      <DeleteCollegeDialog
        centerId={centerId}
        open={Boolean(deletingCollege)}
        onOpenChange={(open) => {
          if (!open) setDeletingCollege(null);
        }}
        college={deletingCollege}
        onSuccess={(message) => setFeedback(message)}
      />
    </div>
  );
}
