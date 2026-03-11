"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";

export default function NewQuotePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("quotes")
      .insert([
        {
          title,
          customer_name: customerName,
        },
      ])
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    router.push(`/quotes/${data.id}`);
  };

  return (
    <main className="page-container">
      <div className="top-bar">
        <div>
          <h1 className="page-title">יצירת הצעה חדשה</h1>
          <p className="page-subtitle">פתיחת הצעת מחיר חדשה ללקוח</p>
        </div>

        <Link href="/quotes" className="link-button secondary-button">
          חזרה לכל ההצעות
        </Link>
      </div>

      <div className="card" style={{ maxWidth: 650 }}>
        <h2 className="card-title">פרטי ההצעה</h2>

        <form onSubmit={handleCreate} className="form-grid">
          <input
            placeholder="שם ההצעה"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            placeholder="שם הלקוח"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <div style={{ marginTop: 8 }}>
            <button type="submit" className="primary-button">
              שמור והמשך
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}