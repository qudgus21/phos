"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  ImagePlus,
  X,
  Loader2,
  MessageSquare,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { useDictionary } from "@/lib/i18n/dictionary-context";
import type { User } from "@supabase/supabase-js";

const MAX_CONTENT_LENGTH = 5000;
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

interface ImagePreview {
  file: File;
  url: string;
}

export default function ContactForm() {
  const { toast } = useToast();
  const dict = useDictionary();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  const handleImageAdd = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const newImages: ImagePreview[] = [];
      for (const file of Array.from(files)) {
        if (images.length + newImages.length >= MAX_IMAGES) {
          toast(dict.contact.validation.maxImages.replace("{max}", String(MAX_IMAGES)), "warning");
          break;
        }
        if (file.size > MAX_IMAGE_SIZE) {
          toast(dict.contact.validation.maxFileSize, "warning");
          continue;
        }
        if (!file.type.startsWith("image/")) {
          toast(dict.contact.validation.imageOnly, "warning");
          continue;
        }
        newImages.push({ file, url: URL.createObjectURL(file) });
      }
      setImages((prev) => [...prev, ...newImages]);
    },
    [images.length, toast]
  );

  const handleImageRemove = useCallback((index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleImageAdd(e.dataTransfer.files);
    },
    [handleImageAdd]
  );

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!category) newErrors.category = dict.contact.validation.categoryRequired;
    if (!subject.trim()) newErrors.subject = dict.contact.validation.titleRequired;
    if (!content.trim()) newErrors.content = dict.contact.validation.contentRequired;
    if (content.length > MAX_CONTENT_LENGTH)
      newErrors.content = dict.contact.validation.contentRequired;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = dict.contact.validation.emailInvalid;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("subject", subject);
      formData.append("content", content);
      if (!user && email) formData.append("email", email);
      images.forEach(({ file }) => formData.append("images", file));

      const res = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error?.message ?? dict.contact.error, "error");
        return;
      }

      toast(dict.contact.success, "success");
      setCategory("");
      setSubject("");
      setContent("");
      setEmail("");
      images.forEach(({ url }) => URL.revokeObjectURL(url));
      setImages([]);
      setErrors({});
    } catch {
      toast(dict.contact.error, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-card">
        <div className="max-w-xl mx-auto px-4 pt-28 pb-20">
          {/* 헤더 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-5">
              <MessageSquare className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold text-foreground font-display mb-2">
              {dict.contact.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              {dict.contact.description}
            </p>
          </motion.div>

          {/* 폼 */}
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-5 bg-white dark:bg-[#1e2044] border border-border rounded-2xl p-6 md:p-8"
          >
            {/* 문의 유형 */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                {dict.contact.form.categoryLabel}
              </label>
              <Dropdown
                options={dict.contact.categories}
                value={category}
                onChange={(val) => {
                  setCategory(val);
                  setErrors((prev) => ({ ...prev, category: "" }));
                }}
                placeholder={dict.contact.form.categoryPlaceholder}
                variant="gradient"
              />
              {errors.category && (
                <p className="mt-1.5 text-sm text-error">{errors.category}</p>
              )}
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                {dict.contact.form.titleLabel}
              </label>
              <Input
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setErrors((prev) => ({ ...prev, subject: "" }));
                }}
                placeholder={dict.contact.form.titlePlaceholder}
                maxLength={200}
                error={errors.subject}
              />
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                {dict.contact.form.contentLabel}
              </label>
              <Textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setErrors((prev) => ({ ...prev, content: "" }));
                }}
                placeholder={dict.contact.form.contentPlaceholder}
                rows={6}
                maxLength={MAX_CONTENT_LENGTH}
                error={errors.content}
              />
              <p className="mt-1 text-xs text-muted-foreground text-right">
                {content.length.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()}
              </p>
            </div>

            {/* 이메일 (비로그인 시) */}
            {!user && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  {dict.contact.form.emailLabel}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  placeholder={dict.contact.form.emailPlaceholder}
                  error={errors.email}
                />
              </div>
            )}

            {/* 이미지 첨부 */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                {dict.contact.form.imageLabel}
              </label>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <ImagePlus className="w-6 h-6 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-sm text-muted-foreground">
                  {dict.contact.form.imageDragText}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  {dict.contact.form.imageFormats}
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleImageAdd(e.target.files);
                  e.target.value = "";
                }}
              />

              <AnimatePresence>
                {images.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-3 mt-3"
                  >
                    {images.map((img, i) => (
                      <motion.div
                        key={img.url}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative group"
                      >
                        <img
                          src={img.url}
                          alt={dict.contact.form.attachmentAlt.replace("{index}", String(i + 1))}
                          className="w-18 h-18 object-cover rounded-lg border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => handleImageRemove(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 구분선 */}
            <div className="border-t border-border" />

            {/* 로그인 시 답변 이메일 안내 */}
            {user && (
              <p className="text-xs text-muted-foreground text-center">
                {dict.contact.replyNotice.replace("{email}", user.email ?? "")}
              </p>
            )}

            {/* 제출 */}
            <Button
              type="submit"
              variant="glow"
              size="md"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {dict.contact.form.submitting}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {dict.contact.form.submit}
                </>
              )}
            </Button>
          </motion.form>
        </div>
      </div>
    </>
  );
}
