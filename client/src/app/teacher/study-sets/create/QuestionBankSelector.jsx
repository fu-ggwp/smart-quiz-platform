"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Folder, BookOpen, AlertTriangle } from "lucide-react";
import { questionBanksService } from "@/services/question-banks.service";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/common/ConfirmModal";

export default function QuestionBankSelector({ 
  onQuestionsSelected, 
  onCancel, 
  lockedBankId = null, 
  onResetBank,
  alreadyImportedIds = [] 
}) {
  const [banks, setBanks] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState(lockedBankId || "");
  const [questions, setQuestions] = useState([]);
  const [groupedQuestions, setGroupedQuestions] = useState({});
  const [selectedQIds, setSelectedQIds] = useState(new Set());
  const [expandedTopics, setExpandedTopics] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});
  const [loading, setLoading] = useState(false);
  const [showConfirmSwitch, setShowConfirmSwitch] = useState(false);

  const importedSet = new Set(alreadyImportedIds);

  // Sync state if lockedBankId changes dynamically
  useEffect(() => {
    let ignore = false;

    async function syncLockedBank() {
      await Promise.resolve();
      if (!ignore) setSelectedBankId(lockedBankId || "");
    }

    syncLockedBank();

    return () => {
      ignore = true;
    };
  }, [lockedBankId]);

  // 1. Fetch Question Banks on component mount
  useEffect(() => {
    async function fetchBanks() {
      try {
        const data = await questionBanksService.listReady();
        setBanks(data || []);
      } catch (err) {
        console.error("Failed to load question banks:", err);
      }
    }
    fetchBanks();
  }, []);

  // 2. Fetch questions when a specific Question Bank is selected
  useEffect(() => {
    if (!selectedBankId) {
      let ignore = false;

      async function clearQuestions() {
        await Promise.resolve();
        if (ignore) return;
        setQuestions([]);
        setGroupedQuestions({});
        setSelectedQIds(new Set());
      }

      clearQuestions();

      return () => {
        ignore = true;
      };
    }

    async function fetchQuestions() {
      setLoading(true);
      try {
        const qList = await questionBanksService.listReadyQuestions(selectedBankId);
        setQuestions(qList);
        setSelectedQIds(new Set()); // Reset previous selections

        // Group questions by Topic and Chapter
        const grouped = {};
        qList.forEach((q) => {
          const topicName = q.topic?.trim() || "No Topic";
          const chapterName = q.chapter?.trim() || "No Chapter";

          if (!grouped[topicName]) {
            grouped[topicName] = {};
          }
          if (!grouped[topicName][chapterName]) {
            grouped[topicName][chapterName] = [];
          }
          grouped[topicName][chapterName].push(q);
        });

        setGroupedQuestions(grouped);

        // Expand all topics by default
        const defaultExpanded = {};
        Object.keys(grouped).forEach((topic) => {
          defaultExpanded[topic] = true;
        });
        setExpandedTopics(defaultExpanded);
      } catch (err) {
        console.error("Failed to load bank questions:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, [selectedBankId]);

  // Toggle expand/collapse for Topic
  const toggleTopic = (topic) => {
    setExpandedTopics((prev) => ({ ...prev, [topic]: !prev[topic] }));
  };

  // Toggle expand/collapse for Chapter
  const toggleChapter = (chapterKey) => {
    setExpandedChapters((prev) => ({ ...prev, [chapterKey]: !prev[chapterKey] }));
  };

  // --- CHECKBOX SELECTION LOGIC ---

  // Get all questions under a specific Topic
  const getQuestionsInTopic = (topic) => {
    const list = [];
    if (groupedQuestions[topic]) {
      Object.values(groupedQuestions[topic]).forEach((chapterQs) => {
        list.push(...chapterQs);
      });
    }
    return list;
  };

  // Get all questions under a specific Chapter in a Topic
  const getQuestionsInChapter = (topic, chapter) => {
    return groupedQuestions[topic]?.[chapter] || [];
  };

  // Handle individual question checkbox toggle
  const handleSelectQuestion = (qId) => {
    if (importedSet.has(qId)) return;
    setSelectedQIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  // Handle Chapter level checkbox toggle (select/deselect all questions in chapter)
  const handleSelectChapter = (topic, chapter, checked) => {
    const chapterQs = getQuestionsInChapter(topic, chapter);
    setSelectedQIds((prev) => {
      const next = new Set(prev);
      chapterQs.forEach((q) => {
        if (importedSet.has(q.question_id)) return;
        if (checked) {
          next.add(q.question_id);
        } else {
          next.delete(q.question_id);
        }
      });
      return next;
    });
  };

  // Handle Topic level checkbox toggle (select/deselect all questions in topic)
  const handleSelectTopic = (topic, checked) => {
    const topicQs = getQuestionsInTopic(topic);
    setSelectedQIds((prev) => {
      const next = new Set(prev);
      topicQs.forEach((q) => {
        if (importedSet.has(q.question_id)) return;
        if (checked) {
          next.add(q.question_id);
        } else {
          next.delete(q.question_id);
        }
      });
      return next;
    });
  };

  // Confirm and import selected questions
  const handleImport = () => {
    const selectedQuestions = questions.filter((q) => selectedQIds.has(q.question_id));
    onQuestionsSelected(selectedQuestions, selectedBankId);
  };

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-lg">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Import from Question Bank</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Select questions from a question bank to add to your drafting list.
          </p>
        </div>
        <Button onClick={onCancel} variant="ghost" size="sm" type="button font-bold">
          Cancel
        </Button>
      </div>

      {/* Select Question Bank Dropdown */}
      <div className="mb-6">
        <label className="flex items-center justify-between text-sm font-semibold text-foreground mb-2">
          <span>
            Select Question Bank
            {lockedBankId && <span className="text-xs text-muted-foreground font-normal ml-2">(Locked to selected bank)</span>}
          </span>
          {lockedBankId && onResetBank && (
            <button
              type="button"
              onClick={() => setShowConfirmSwitch(true)}
              className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-bold"
            >
              Switch Bank
            </button>
          )}
        </label>
        <select
          className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring disabled:opacity-60 disabled:cursor-not-allowed"
          value={selectedBankId}
          onChange={(e) => setSelectedBankId(e.target.value)}
          disabled={!!lockedBankId}
        >
          <option value="">-- Select Question Bank --</option>
          {banks.map((bank) => (
            <option key={bank.question_bank_id} value={bank.question_bank_id}>
              {bank.title} ({bank.subject || "No Subject"})
            </option>
          ))}
        </select>
      </div>

      {/* Tree view of Topics, Chapters and Questions */}
      {selectedBankId && (
        <div className="border border-border rounded-xl bg-muted/30 p-4 max-h-[450px] overflow-y-auto mb-6">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading questions...</p>
          ) : questions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">This question bank has no questions.</p>
          ) : (
            <div className="space-y-4">
              {Object.keys(groupedQuestions).map((topic) => {
                const topicQs = getQuestionsInTopic(topic);
                const isTopicChecked = topicQs.every((q) => importedSet.has(q.question_id) || selectedQIds.has(q.question_id));
                const isTopicIndeterminate =
                  topicQs.some((q) => selectedQIds.has(q.question_id)) && !isTopicChecked;
                const isTopicDisabled = topicQs.every((q) => importedSet.has(q.question_id));

                return (
                  <div key={topic} className="space-y-1">
                    {/* TOPIC ROW */}
                    <div className="flex items-center gap-2 py-1.5 hover:bg-muted/50 rounded-lg px-2">
                      <button
                        type="button"
                        onClick={() => toggleTopic(topic)}
                        className="text-muted-foreground p-0.5 hover:text-foreground"
                      >
                        {expandedTopics[topic] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      <input
                        type="checkbox"
                        className="rounded border-input text-primary focus:ring-primary size-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        checked={isTopicChecked}
                        disabled={isTopicDisabled}
                        ref={(el) => {
                          if (el) el.indeterminate = isTopicIndeterminate;
                        }}
                        onChange={(e) => handleSelectTopic(topic, e.target.checked)}
                      />
                      <Folder className="size-4 text-amber-500 fill-amber-500/10" />
                      <span className="text-sm font-bold text-foreground cursor-pointer" onClick={() => toggleTopic(topic)}>
                        Topic: {topic}
                      </span>
                      <span className="text-xs text-muted-foreground">({topicQs.length} Qs)</span>
                    </div>

                    {/* CHAPTERS ACCORDION */}
                    {expandedTopics[topic] && (
                      <div className="pl-6 space-y-2 border-l border-border/60 ml-4">
                        {Object.keys(groupedQuestions[topic]).map((chapter) => {
                          const chapterKey = `${topic}::${chapter}`;
                          const chapterQs = getQuestionsInChapter(topic, chapter);
                          const isChapterChecked = chapterQs.every((q) => importedSet.has(q.question_id) || selectedQIds.has(q.question_id));
                          const isChapterIndeterminate =
                            chapterQs.some((q) => selectedQIds.has(q.question_id)) && !isChapterChecked;
                          const isChapterDisabled = chapterQs.every((q) => importedSet.has(q.question_id));

                          return (
                            <div key={chapter} className="space-y-1">
                              {/* CHAPTER ROW */}
                              <div className="flex items-center gap-2 py-1 hover:bg-muted/50 rounded-lg px-2">
                                <button
                                  type="button"
                                  onClick={() => toggleChapter(chapterKey)}
                                  className="text-muted-foreground p-0.5"
                                >
                                  {expandedChapters[chapterKey] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                                <input
                                  type="checkbox"
                                  className="rounded border-input text-primary focus:ring-primary size-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  checked={isChapterChecked}
                                  disabled={isChapterDisabled}
                                  ref={(el) => {
                                    if (el) el.indeterminate = isChapterIndeterminate;
                                  }}
                                  onChange={(e) => handleSelectChapter(topic, chapter, e.target.checked)}
                                />
                                <BookOpen className="size-4 text-blue-500 fill-blue-500/10" />
                                <span className="text-sm font-semibold text-foreground cursor-pointer font-medium" onClick={() => toggleChapter(chapterKey)}>
                                  Chapter: {chapter}
                                </span>
                                <span className="text-xs text-muted-foreground">({chapterQs.length} Qs)</span>
                              </div>

                              {/* QUESTIONS LIST */}
                              {expandedChapters[chapterKey] && (
                                <div className="pl-6 space-y-1.5 border-l border-border/60 ml-4 py-1">
                                  {chapterQs.map((q) => (
                                    <div key={q.question_id} className="flex items-start gap-3 p-2 hover:bg-muted/80 rounded-lg">
                                      <input
                                        type="checkbox"
                                        className="rounded border-input text-primary focus:ring-primary size-4 cursor-pointer mt-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                        checked={importedSet.has(q.question_id) || selectedQIds.has(q.question_id)}
                                        onChange={() => handleSelectQuestion(q.question_id)}
                                        disabled={importedSet.has(q.question_id)}
                                      />
                                      <div className="flex-1 text-sm">
                                        <div className="flex items-start gap-2">
                                          <p className="text-foreground leading-relaxed font-normal">{q.question_text}</p>
                                          {importedSet.has(q.question_id) && (
                                            <span className="shrink-0 text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-semibold border border-emerald-100">
                                              Added
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex justify-between items-center border-t border-border pt-4">
        <span className="text-sm font-semibold text-muted-foreground">
          Selected: <span className="text-foreground font-bold">{selectedQIds.size}</span> questions
        </span>
        <div className="flex gap-2">
          <Button onClick={onCancel} variant="outline" size="sm" type="button">
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedQIds.size === 0}
            size="sm"
            type="button"
          >
            Import {selectedQIds.size > 0 ? `(${selectedQIds.size})` : ""}
          </Button>
        </div>
      </div>

      {/* Switch Bank Confirmation Popup Modal */}
      <ConfirmModal
        isOpen={showConfirmSwitch}
        title="Switch Question Bank?"
        message="Switching the question bank will remove all questions imported from the current bank. This action cannot be undone. Do you want to proceed?"
        confirmLabel="Yes, Switch Bank"
        cancelLabel="Cancel"
        onConfirm={() => {
          onResetBank();
          setShowConfirmSwitch(false);
        }}
        onCancel={() => setShowConfirmSwitch(false)}
        variant="danger"
      />
    </div>
  );
}
