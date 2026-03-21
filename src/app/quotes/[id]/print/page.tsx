"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/src/lib/supabase";

type Quote = {
  id: number;
  title: string;
  customer_name: string | null;
  created_at: string;
};

type Item = {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
};

export default function PrintQuotePage() {
  const params = useParams();
  const quoteId = Number(params.id);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quoteId) return;
    loadData();
  }, [quoteId]);

  const loadData = async () => {
    setLoading(true);

    const { data: quoteData, error: quoteError } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .single();

    if (quoteError) {
      alert(quoteError.message);
      setLoading(false);
      return;
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", quoteId)
      .order("id", { ascending: true });

    if (itemsError) {
      alert(itemsError.message);
      setLoading(false);
      return;
    }

    setQuote(quoteData);
    setItems(itemsData || []);
    setLoading(false);
  };

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + Number(item.quantity) * Number(item.unit_price);
    }, 0);
  }, [items]);

  if (loading) {
    return <main className="page-container">טוען...</main>;
  }

  return (
    <main
      className="page-container"
      style={{
        maxWidth: 900,
        background: "white",
        minHeight: "100vh",
      }}
    >
      <div className="top-bar" style={{ marginBottom: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Image
            src="/logo.png"
            alt="לוגו רונן סרור"
            width={80}
            height={80}
            style={{ objectFit: "contain" }}
          />

          <div>
            <h1 className="page-title" style={{ marginBottom: 6 }}>
              הצעת מחיר
            </h1>
            <p className="page-subtitle" style={{ marginBottom: 4 }}>
              רונן סרור - עבודות חשמל ותקשורת
            </p>
            <p className="muted-text" style={{ margin: 0 }}>
              0549599949
            </p>
          </div>
        </div>

        <button className="primary-button" onClick={() => window.print()}>
          הדפס / שמור PDF
        </button>
      </div>

      <div
        className="card"
        style={{ boxShadow: "none", border: "1px solid #e5e7eb" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 30,
          }}
        >
          <div>
            <div className="muted-text">שם ההצעה</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>
              {quote?.title}
            </div>
          </div>

          <div>
            <div className="muted-text">לקוח</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>
              {quote?.customer_name || "ללא שם לקוח"}
            </div>
          </div>

          <div>
            <div className="muted-text">תאריך</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>
              {quote?.created_at
                ? new Date(quote.created_at).toLocaleDateString("he-IL")
                : ""}
            </div>
          </div>
        </div>

        <div className="quote-grid-header">
          <div>תיאור עבודה</div>
          <div>כמות</div>
          <div>מחיר ליחידה</div>
          <div>סכום</div>
          <div></div>
        </div>

        {items.map((item) => {
          const lineTotal = Number(item.quantity) * Number(item.unit_price);

          return (
            <div
              key={item.id}
              className="quote-grid-row"
              style={{ gridTemplateColumns: "3fr 1fr 1fr 1fr 0fr" }}
            >
              <div>{item.description}</div>
              <div>{item.quantity}</div>
              <div>₪{item.unit_price}</div>
              <div style={{ fontWeight: 700 }}>₪{lineTotal}</div>
              <div></div>
            </div>
          );
        })}

        <div style={{ marginTop: 30 }}>
          <div className="total-box">סה״כ: ₪{total}</div>
        </div>
         <div style={{ marginTop: 35 }}>
          <div className="total-box"> לא כולל מע״מ</div>
        </div>
      </div>
    </main>
  );
}