import React from "react";
import { Student } from "@/types";
import styles from "../../app/(dashboard)/students/[id]/page.module.scss";
import { stringToColor } from "@/lib/utils";

interface StudentHeaderProps {
  student: Student;
}

export function StudentNote({ student }: StudentHeaderProps) {
  return (
    <>
      {student.note && (
        <div className={styles.studentNote}>
          <div
            style={{ backgroundColor: stringToColor(student.name) }}
            className={styles.leftBar}
          />
          <strong>Заметка</strong>
          <p>{student.note}</p>
        </div>
      )}
    </>
  )
}
