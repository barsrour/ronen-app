"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";

type Quote = {
  id: number;
  title: string;
  customer_name: string | null;
  created_at: string;
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    const loadQuotes = async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        alert(error.message);
        return;
      }

      setQuotes(data || []);
    };

    loadQuotes();
  }, []);

  return (
    <main className="page-container">
      <div className="top-bar">
        <div>
          <h1 className="page-title">כל ההצעות</h1>
          <p className="page-subtitle">
            צפייה, עריכה וניהול של כל הצעות המחיר
          </p>
        </div>

        <Link href="/quotes/new" className="link-button primary-button">
          יצירת הצעה חדשה
        </Link>
      </div>

      <div className="quotes-list">
        {quotes.length === 0 ? (
          <div className="card">
            <h2 className="card-title">אין עדיין הצעות</h2>
            <p className="muted-text">כדאי להתחיל ביצירת הצעת המחיר הראשונה.</p>
          </div>
        ) : (
          quotes.map((quote) => (
            <Link
              key={quote.id}
              href={`/quotes/${quote.id}`}
              className="quote-list-card"
            >
              <div className="quote-list-title">{quote.title}</div>
              <div className="muted-text">
                לקוח: {quote.customer_name || "ללא שם לקוח"}
              </div>
              <div
                className="muted-text"
                style={{ fontSize: 14, marginTop: 8 }}
              >
                נוצר בתאריך{" "}
                {new Date(quote.created_at).toLocaleDateString("he-IL")}
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}