import React from "react";
import { Student } from "@/types";
import styles from "../../app/(dashboard)/students/[id]/page.module.scss";

interface StudentHeaderProps {
  student: Student;
}

export function StudentNote({ student }: StudentHeaderProps) {
  return (
    <>
      {student.note && (
        <div className={styles.studentNote}>
          <strong>Заметка</strong>
          <p>{student.note}</p>
        </div>
      )}
    </>
  );
}
