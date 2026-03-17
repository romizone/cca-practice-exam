import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { sql } from "@vercel/postgres";

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT user_name, user_email, user_image, score, correct, total, passed, exam_set, time_spent, created_at
      FROM scores
      ORDER BY score DESC, created_at ASC
      LIMIT 50
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch scores:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { score, correct, total, passed, examSet, timeSpent } = body;

    const { rows } = await sql`
      INSERT INTO scores (user_id, user_name, user_email, user_image, score, correct, total, passed, exam_set, time_spent)
      VALUES (
        ${session.user.email},
        ${session.user.name},
        ${session.user.email},
        ${session.user.image},
        ${score},
        ${correct},
        ${total},
        ${passed},
        ${examSet},
        ${timeSpent}
      )
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to save score:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
