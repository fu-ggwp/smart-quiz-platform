"use client";

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function getStudySetId(studySet) {
  return studySet.study_set_id ?? studySet.id;
}

function getQuestionCount(studySet) {
  return studySet.question_count ?? studySet.questionCount ?? 0;
}

function getTeacher(studySet) {
  const teacher = studySet.teacher ?? {};
  const name =
    teacher.full_name ??
    teacher.username ??
    studySet.teacher_name ??
    studySet.ownerName ??
    "Unknown";

  return {
    avatarUrl: teacher.avatar_url ?? studySet.teacher_avatar_url ?? null,
    name,
  };
}

function getInitial(value) {
  return String(value || "?")
    .charAt(0)
    .toUpperCase();
}

export function StudySetCard({ studySet }) {
  const id = getStudySetId(studySet);
  const href = id ? `/study-sets/${id}` : "/search";
  const questionCount = getQuestionCount(studySet);
  const teacher = getTeacher(studySet);

  return (
    <Link
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      href={href}
    >
      <Card className="min-h-52 rounded-lg border border-border py-0  transition-colors hover:border-primary/60 hover:bg-accent/30">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="truncate text-xl font-bold text-foreground" title={studySet.title || "Untitled study set"}>
            {studySet.title || "Untitled study set"}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 px-6 pt-4">
          <Badge
            className="h-auto rounded-full px-3 py-1 text-sm font-bold"
            variant="secondary"
          >
            {questionCount} questions
          </Badge>
        </CardContent>

        <CardFooter className="gap-2 px-6 pb-6">
          <Avatar>
            {teacher.avatarUrl ? (
              <AvatarImage alt={teacher.name} src={teacher.avatarUrl} />
            ) : null}
            <AvatarFallback>{getInitial(teacher.name)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 truncate text-base font-bold text-foreground">
            {teacher.name}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
