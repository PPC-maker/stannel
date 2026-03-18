import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, SlidersHorizontal, Bookmark, BookmarkCheck, X, ChevronDown, ChevronUp } from "lucide-react";
import { Label } from "@/components/ui/label";

/**
 * AdvancedSearch - reusable advanced search/filter bar with saved searches
 *
 * Props:
 *   page: string (unique page identifier)
 *   filters: object (current filter state)
 *   onFiltersChange: fn(filters) => void
 *   filterFields: array of field definitions:
 *     { key, label, type: "text"|"select"|"date"|"amount", options?: [{value, label}] }
 */
export default function AdvancedSearch({ page, filters, onFiltersChange, filterFields }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      loadSaved(u.email);
    });
  }, []);

  const loadSaved = async (email) => {
    const results = await base44.entities.SavedSearch.filter({ user_email: email, page });
    setSavedSearches(results);
  };

  const hasActiveFilters = Object.entries(filters).some(([k, v]) => {
    if (k === "search") return v && v.length > 0;
    return v && v !== "all" && v !== "";
  });

  const handleSave = async () => {
    if (!saveName.trim() || !user) return;
    await base44.entities.SavedSearch.create({
      user_email: user.email,
      page,
      name: saveName.trim(),
      filters: JSON.stringify(filters),
    });
    setSaveName("");
    setShowSaveDialog(false);
    loadSaved(user.email);
  };

  const handleLoad = (saved) => {
    try {
      const parsed = JSON.parse(saved.filters);
      onFiltersChange(parsed);
    } catch {}
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await base44.entities.SavedSearch.delete(id);
    loadSaved(user.email);
  };

  const handleClear = () => {
    const cleared = {};
    filterFields.forEach(f => {
      if (f.type === "select") cleared[f.key] = "all";
      else cleared[f.key] = "";
    });
    onFiltersChange(cleared);
  };

  return (
    <div className="mb-6 space-y-3">
      {/* Main search row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="חיפוש חופשי..."
            value={filters.search || ""}
            onChange={e => onFiltersChange({ ...filters, search: e.target.value })}
            className="pr-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(v => !v)}
          className={`gap-1.5 text-xs ${showAdvanced ? "bg-gray-100" : ""}`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          סינון
          {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-xs text-red-500 hover:text-red-600 gap-1">
            <X className="w-3.5 h-3.5" />
            נקה
          </Button>
        )}
      </div>

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filterFields.filter(f => f.key !== "search").map(field => (
              <div key={field.key}>
                <Label className="text-[11px] text-gray-500 mb-1 block">{field.label}</Label>
                {field.type === "select" ? (
                  <Select value={filters[field.key] || "all"} onValueChange={v => onFiltersChange({ ...filters, [field.key]: v })}>
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">הכל</SelectItem>
                      {field.options?.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === "date" ? (
                  <Input
                    type="date"
                    value={filters[field.key] || ""}
                    onChange={e => onFiltersChange({ ...filters, [field.key]: e.target.value })}
                    className="h-8 text-xs bg-white"
                  />
                ) : field.type === "amount" ? (
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      placeholder="מ-"
                      value={filters[field.key + "_min"] || ""}
                      onChange={e => onFiltersChange({ ...filters, [field.key + "_min"]: e.target.value })}
                      className="h-8 text-xs bg-white"
                    />
                    <Input
                      type="number"
                      placeholder="עד"
                      value={filters[field.key + "_max"] || ""}
                      onChange={e => onFiltersChange({ ...filters, [field.key + "_max"]: e.target.value })}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                ) : (
                  <Input
                    value={filters[field.key] || ""}
                    onChange={e => onFiltersChange({ ...filters, [field.key]: e.target.value })}
                    className="h-8 text-xs bg-white"
                    placeholder={field.placeholder || ""}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Saved searches */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-gray-500 font-medium">חיפושים שמורים</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] gap-1 text-indigo-600 hover:text-indigo-700"
                onClick={() => { setSaveName(""); setShowSaveDialog(true); }}
              >
                <Bookmark className="w-3 h-3" />
                שמור חיפוש נוכחי
              </Button>
            </div>
            {savedSearches.length === 0 ? (
              <p className="text-[11px] text-gray-400">אין חיפושים שמורים</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {savedSearches.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleLoad(s)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-md text-[11px] text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors group"
                  >
                    <BookmarkCheck className="w-3 h-3 text-indigo-400" />
                    {s.name}
                    <X
                      className="w-3 h-3 text-gray-300 group-hover:text-red-400 transition-colors"
                      onClick={(e) => handleDelete(s.id, e)}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-sm">שמור חיפוש</DialogTitle>
          </DialogHeader>
          <Input
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            placeholder="שם לחיפוש..."
            className="mt-1"
            onKeyDown={e => e.key === "Enter" && handleSave()}
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(false)}>ביטול</Button>
            <Button size="sm" onClick={handleSave} disabled={!saveName.trim()} className="bg-gray-900">
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}