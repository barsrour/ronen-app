import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="page-container">
      <h1 className="page-title">מערכת הצעות מחיר</h1>
      <p className="page-subtitle">ניהול פשוט, מהיר ונוח של הצעות מחיר</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
        }}
      >
        <Link href="/quotes/new" className="card">
          <h2 className="card-title">יצירת הצעה חדשה</h2>
          <p className="muted-text">פתיחת הצעת מחיר חדשה ללקוח</p>
        </Link>

        <Link href="/quotes" className="card">
          <h2 className="card-title">כל ההצעות</h2>
          <p className="muted-text">צפייה, עריכה ומחיקה של הצעות קיימות</p>
        </Link>
      </div>
    </main>
  );
}