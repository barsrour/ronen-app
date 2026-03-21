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

type Section = {
  id?: number;
  title: string;
  items: Item[];
};

const workOptions = [
  "נקודת חשמל",
  "נקודת חשמל כח",
  "נקודת חשמל כפולה",
  "נקודת חשמל מוגנת מים",
  "נקודת חשמל תלת פאזי",
  "נקודת חשמל עבור תנור חימום",
  "נקודת חשמל עבור דוד שמש",
  "נקודת חשמל כולל סימה בוקס",
  "נקודת תאורה",
  "נקודת תאורת חירום",
  "נקודת תאורה חילוף",
  "נקודת תאורה צלב",
  "נקודת תקשורת",
  "התקנת גוף תאורה צמוד תקרה",
  "התקנת גוף תאורה קירי",
  "התקנת מאוורר תקרה",
  "אספקה והתקנת לוח חשמל",
  "אספקה והתקנת לוח תקשורת",
  "אספקה והתקנת ארון תקשורת",
  "אספקה והתקנת פס שקעי חשמל בארון התקשורת",
  "אספקה והתקנת פאנל 16 מבואות",
  "אספקה והתקנת צינור מריכף",
];

export default function QuotePage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = Number(params.id);

  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeInput, setActiveInput] = useState<{
    sectionIndex: number;
    itemIndex: number;
  } | null>(null);

  const [showAllInput, setShowAllInput] = useState<{
    sectionIndex: number;
    itemIndex: number;
  } | null>(null);

  useEffect(() => {
    if (!quoteId) return;
    loadQuoteAndSections();
  }, [quoteId]);

  const loadQuoteAndSections = async () => {
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

    const { data: sectionsData, error: sectionsError } = await supabase
      .from("quote_sections")
      .select("*")
      .eq("quote_id", quoteId)
      .order("id", { ascending: true });

    if (sectionsError) {
      alert(sectionsError.message);
      setLoading(false);
      return;
    }

    const builtSections: Section[] = [];

    for (const section of sectionsData || []) {
      const { data: itemsData, error: itemsError } = await supabase
        .from("quote_items")
        .select("*")
        .eq("section_id", section.id)
        .order("id", { ascending: true });

      if (itemsError) {
        alert(itemsError.message);
        setLoading(false);
        return;
      }

      builtSections.push({
        id: section.id,
        title: section.title,
        items: (itemsData || []).map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });
    }

    setSections(builtSections);
    setLoading(false);
  };

  const addSection = () => {
    setSections([
      ...sections,
      {
        title: "",
        items: [],
      },
    ]);
  };

  const removeSection = (sectionIndex: number) => {
    const updated = [...sections];
    updated.splice(sectionIndex, 1);
    setSections(updated);
  };

  const updateSectionTitle = (sectionIndex: number, value: string) => {
    const updated = [...sections];
    updated[sectionIndex] = {
      ...updated[sectionIndex],
      title: value,
    };
    setSections(updated);
  };

  const addItemToSection = (sectionIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex].items.push({
      description: "",
      quantity: 1,
      unit_price: 0,
    });
    setSections(updated);
  };

  const removeItemFromSection = (sectionIndex: number, itemIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex].items.splice(itemIndex, 1);
    setSections(updated);
  };

  const updateItem = (
    sectionIndex: number,
    itemIndex: number,
    field: keyof Item,
    value: string
  ) => {
    const updated = [...sections];
    updated[sectionIndex].items[itemIndex] = {
      ...updated[sectionIndex].items[itemIndex],
      [field]: field === "description" ? value : Number(value),
    };
    setSections(updated);
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

    const { error: deleteSectionsError } = await supabase
      .from("quote_sections")
      .delete()
      .eq("quote_id", quoteId);

    if (deleteSectionsError) {
      alert(deleteSectionsError.message);
      return;
    }

    for (const section of sections) {
      if (!section.title.trim()) continue;

      const { data: insertedSection, error: sectionInsertError } = await supabase
        .from("quote_sections")
        .insert({
          quote_id: quoteId,
          title: section.title,
        })
        .select()
        .single();

      if (sectionInsertError) {
        alert(sectionInsertError.message);
        return;
      }

      const validItems = section.items.filter(
        (item) => item.description.trim() !== ""
      );

      if (validItems.length > 0) {
        const rows = validItems.map((item) => ({
          quote_id: quoteId,         
          section_id: insertedSection.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }));

        const { error: itemsInsertError } = await supabase
          .from("quote_items")
          .insert(rows);

        if (itemsInsertError) {
          alert(itemsInsertError.message);
          return;
        }
      }
    }

    alert("ההצעה נשמרה בהצלחה");
    loadQuoteAndSections();
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
    return sections.reduce((sectionsSum, section) => {
      const sectionSum = section.items.reduce((itemsSum, item) => {
        return itemsSum + Number(item.quantity) * Number(item.unit_price);
      }, 0);

      return sectionsSum + sectionSum;
    }, 0);
  }, [sections]);

  if (loading) {
    return <main className="page-container">טוען...</main>;
  }

  return (
    <main className="page-container">
      <div className="top-bar">
        <div>
          <h1 className="page-title">עריכת הצעה</h1>
          <p className="page-subtitle">ניהול פרטי ההצעה, אזורים ושורות עבודה</p>
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
            אזורים / מיקומים
          </h2>

          <button className="primary-button" onClick={addSection}>
            הוסף אזור
          </button>
        </div>

        {sections.length === 0 && (
          <div className="muted-text">עדיין לא נוספו אזורים להצעה.</div>
        )}

        {sections.map((section, sectionIndex) => {
          const sectionTotal = section.items.reduce((sum, item) => {
            return sum + Number(item.quantity) * Number(item.unit_price);
          }, 0);

          return (
            <div
              key={sectionIndex}
              className="card"
              style={{
                marginBottom: 20,
                background: "#fafafa",
                border: "1px solid #e5e7eb",
                boxShadow: "none",
              }}
            >
              <div className="top-bar" style={{ marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <input
                    placeholder="שם האזור / מיקום (למשל סלון)"
                    value={section.title}
                    onChange={(e) =>
                      updateSectionTitle(sectionIndex, e.target.value)
                    }
                  />
                </div>

                <div className="action-row">
                  <button
                    className="secondary-button"
                    onClick={() => addItemToSection(sectionIndex)}
                  >
                    הוסף שורה
                  </button>

                  <button
                    className="danger-button"
                    onClick={() => removeSection(sectionIndex)}
                  >
                    מחק אזור
                  </button>
                </div>
              </div>

              <div
                className="quote-grid-header"
                style={{ gridTemplateColumns: "3fr 1fr 1fr 1fr auto" }}
              >
                <div>תיאור עבודה</div>
                <div>כמות</div>
                <div>מחיר ליחידה</div>
                <div>סכום</div>
                <div></div>
              </div>

              {section.items.map((item, itemIndex) => {
                const lineTotal =
                  Number(item.quantity) * Number(item.unit_price);

                const isActive =
                  activeInput?.sectionIndex === sectionIndex &&
                  activeInput?.itemIndex === itemIndex;

                const isShowAll =
                  showAllInput?.sectionIndex === sectionIndex &&
                  showAllInput?.itemIndex === itemIndex;

                const filteredOptions = isShowAll
                  ? workOptions
                  : workOptions.filter((option) =>
                    option
                      .toLowerCase()
                      .includes(item.description.toLowerCase())
                  );

                return (
                  <div
                    key={itemIndex}
                    className="quote-grid-row"
                    style={{ gridTemplateColumns: "3fr 1fr 1fr 1fr auto" }}
                  >
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "relative" }}>
                        <input
                          placeholder="תיאור עבודה"
                          value={item.description}
                          onChange={(e) => {
                            updateItem(
                              sectionIndex,
                              itemIndex,
                              "description",
                              e.target.value
                            );
                            setActiveInput({ sectionIndex, itemIndex });
                            setShowAllInput(null);
                          }}
                          onFocus={() =>
                            setActiveInput({ sectionIndex, itemIndex })
                          }
                          onBlur={() => {
                            setTimeout(() => {
                              setActiveInput(null);
                              setShowAllInput(null);
                            }, 150);
                          }}
                          style={{ paddingLeft: 40 }}
                        />

                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setActiveInput({ sectionIndex, itemIndex });
                            setShowAllInput(
                              isShowAll ? null : { sectionIndex, itemIndex }
                            );
                          }}
                          style={{
                            position: "absolute",
                            left: 10,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "transparent",
                            border: "none",
                            padding: 0,
                            fontSize: 16,
                            cursor: "pointer",
                            color: "#6b7280",
                          }}
                        >
                          ▾
                        </button>
                      </div>

                      {(isActive || isShowAll) && filteredOptions.length > 0 && (
                        <div className="autocomplete-box">
                          {filteredOptions.map((option) => (
                            <div
                              key={option}
                              className="autocomplete-item"
                              onMouseDown={() => {
                                updateItem(
                                  sectionIndex,
                                  itemIndex,
                                  "description",
                                  option
                                );
                                setActiveInput(null);
                                setShowAllInput(null);
                              }}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <input
                      type="number"
                      min="0"
                      placeholder="כמות"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          sectionIndex,
                          itemIndex,
                          "quantity",
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="number"
                      min="0"
                      placeholder="מחיר"
                      value={item.unit_price}
                      onChange={(e) =>
                        updateItem(
                          sectionIndex,
                          itemIndex,
                          "unit_price",
                          e.target.value
                        )
                      }
                    />

                    <div style={{ fontWeight: 700 }}>₪{lineTotal}</div>

                    <button
                      className="danger-button"
                      onClick={() => removeItemFromSection(sectionIndex, itemIndex)}
                    >
                      מחק
                    </button>
                  </div>
                );
              })}

              {section.items.length === 0 && (
                <div className="muted-text" style={{ marginTop: 12 }}>
                  עדיין לא נוספו שורות עבודה באזור הזה.
                </div>
              )}

              <div style={{ marginTop: 18, fontWeight: 700 }}>
                סה״כ לאזור: ₪{sectionTotal}
              </div>
            </div>
          );
        })}
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