"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";

type Item = {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
};

export default function QuotePage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = Number(params.id);

  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quoteId) return;
    loadQuoteAndItems();
  }, [quoteId]);

  const loadQuoteAndItems = async () => {
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

    setTitle(quoteData.title || "");
    setCustomerName(quoteData.customer_name || "");

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

    setItems(itemsData || []);
    setLoading(false);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        quantity: 1,
        unit_price: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const updateItem = (
    index: number,
    field: keyof Item,
    value: string
  ) => {
    const updated = [...items];

    updated[index] = {
      ...updated[index],
      [field]: field === "description" ? value : Number(value),
    };

    setItems(updated);
  };

  const saveQuote = async () => {
    const { error: quoteUpdateError } = await supabase
      .from("quotes")
      .update({
        title,
        customer_name: customerName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quoteId);

    if (quoteUpdateError) {
      alert(quoteUpdateError.message);
      return;
    }

    const { error: deleteError } = await supabase
      .from("quote_items")
      .delete()
      .eq("quote_id", quoteId);

    if (deleteError) {
      alert(deleteError.message);
      return;
    }

    const validRows = items.filter((item) => item.description.trim() !== "");

    if (validRows.length > 0) {
      const rows = validRows.map((item) => ({
        quote_id: quoteId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      const { error: insertError } = await supabase
        .from("quote_items")
        .insert(rows);

      if (insertError) {
        alert(insertError.message);
        return;
      }
    }

    alert("ההצעה נשמרה בהצלחה");
    loadQuoteAndItems();
  };

  const deleteQuote = async () => {
    const confirmed = window.confirm("למחוק את ההצעה?");
    if (!confirmed) return;

    const { error } = await supabase.from("quotes").delete().eq("id", quoteId);

    if (error) {
      alert(error.message);
      return;
    }

    alert("ההצעה נמחקה");
    router.push("/quotes");
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
    <main className="page-container">
      <div className="top-bar">
        <div>
          <h1 className="page-title">עריכת הצעה</h1>
          <p className="page-subtitle">ניהול פרטי ההצעה ושורות העבודה</p>
        </div>

        <div className="action-row">
          <Link href="/quotes" className="link-button secondary-button">
            חזרה לכל ההצעות
          </Link>
          <Link
            href={`/quotes/${quoteId}/print`}
            className="link-button secondary-button"
          >
            תצוגת הדפסה / PDF
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card-title">פרטי ההצעה</h2>

        <div
          className="form-grid"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
        >
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
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="top-bar" style={{ marginBottom: 18 }}>
          <h2 className="card-title" style={{ margin: 0 }}>
            שורות עבודה
          </h2>

          <button className="primary-button" onClick={addItem}>
            הוסף שורה
          </button>
        </div>

        <div className="quote-grid-header">
          <div>תיאור עבודה</div>
          <div>כמות</div>
          <div>מחיר ליחידה</div>
          <div>סכום</div>
          <div></div>
        </div>

        {items.map((item, index) => {
          const lineTotal = Number(item.quantity) * Number(item.unit_price);

          return (
            <div key={index} className="quote-grid-row">
              <input
                placeholder="תיאור עבודה"
                value={item.description}
                onChange={(e) =>
                  updateItem(index, "description", e.target.value)
                }
              />

              <input
                type="number"
                min="0"
                placeholder="כמות"
                value={item.quantity}
                onChange={(e) => updateItem(index, "quantity", e.target.value)}
              />

              <input
                type="number"
                min="0"
                placeholder="מחיר"
                value={item.unit_price}
                onChange={(e) =>
                  updateItem(index, "unit_price", e.target.value)
                }
              />

              <div style={{ fontWeight: 700 }}>₪{lineTotal}</div>

              <button
                className="danger-button"
                onClick={() => removeItem(index)}
              >
                מחק
              </button>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="muted-text" style={{ marginTop: 12 }}>
            עדיין לא נוספו שורות להצעה.
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card-title">סה״כ הצעה</h2>
        <div className="total-box">₪{total}</div>
      </div>

      <div className="action-row">
        <button className="primary-button" onClick={saveQuote}>
          שמור הצעה
        </button>

        <button className="danger-button" onClick={deleteQuote}>
          מחק הצעה
        </button>
      </div>
    </main>
  );
}