"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

type Item = {
  description: string;
  quantity: number;
  unit_price: number;
};

type Section = {
  title: string;
  items: Item[];
};

export default function PrintPage() {
  const params = useParams();
  const quoteId = Number(params.id);

  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quoteId) return;
    loadData();
  }, [quoteId]);

  const loadData = async () => {
    setLoading(true);

    // שליפת הצעה
    const { data: quoteData } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .single();

    setTitle(quoteData?.title || "");
    setCustomerName(quoteData?.customer_name || "");

    // שליפת אזורים
    const { data: sectionsData } = await supabase
      .from("quote_sections")
      .select("*")
      .eq("quote_id", quoteId)
      .order("id", { ascending: true });

    const builtSections: Section[] = [];

    for (const section of sectionsData || []) {
      const { data: itemsData } = await supabase
        .from("quote_items")
        .select("*")
        .eq("section_id", section.id)
        .order("id", { ascending: true });

      builtSections.push({
        title: section.title,
        items: (itemsData || []).map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });
    }

    setSections(builtSections);
    setLoading(false);
  };

  const total = sections.reduce((sum, section) => {
    return (
      sum +
      section.items.reduce((s, item) => {
        return s + item.quantity * item.unit_price;
      }, 0)
    );
  }, 0);

  if (loading) {
    return <div style={{ padding: 40 }}>טוען...</div>;
  }

  return (
    <div className="print-page" dir="rtl">
      {/* HEADER */}
      <div className="print-header">
        <div>
          <h1>רונן סרור</h1>
          <p>עבודות חשמל ותקשורת</p>
        </div>

        <img src="/logo.png" className="print-logo" />
      </div>

      {/* פרטי הצעה */}
      <div className="print-info">
        <h2>{title}</h2>
        <p>לקוח: {customerName}</p>
      </div>

      {/* אזורים */}
      {sections.map((section, i) => {
        const sectionTotal = section.items.reduce((sum, item) => {
          return sum + item.quantity * item.unit_price;
        }, 0);

        return (
          <div key={i} className="print-section">
            <h3 className="section-title">{section.title}</h3>

            <table className="print-table">
              <thead>
                <tr>
                  <th>תיאור עבודה</th>
                  <th>כמות</th>
                  <th>מחיר</th>
                  <th>סה״כ</th>
                </tr>
              </thead>

              <tbody>
                {section.items.map((item, j) => (
                  <tr key={j}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>₪{item.unit_price}</td>
                    <td>₪{item.quantity * item.unit_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="section-total">
              סה״כ לאזור: ₪{sectionTotal}
            </div>
          </div>
        );
      })}

      {/* TOTAL */}
      <div className="print-total">
        סה״כ הצעה: ₪{total}
      </div>

      {/* PRINT BUTTON */}
      <div className="no-print">
        <button onClick={() => window.print()} className="print-button">
          הדפס / שמור כ-PDF
        </button>
      </div>
    </div>
  );
}