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
import { Footer } from "@/components/sections/footer";
import type { User } from "@supabase/supabase-js";

const CATEGORIES = [
  { value: "bug_report", label: "오류 신고" },
  { value: "feature_request", label: "기능 제안" },
  { value: "account_issue", label: "계정 문제" },
  { value: "payment_refund", label: "결제/환불" },
  { value: "other", label: "기타" },
];

const MAX_CONTENT_LENGTH = 5000;
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

interface ImagePreview {
  file: File;
  url: string;
}

export default function ContactPage() {
  const { toast } = useToast();
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
          toast(`최대 ${MAX_IMAGES}장까지 첨부 가능합니다.`, "warning");
          break;
        }
        if (file.size > MAX_IMAGE_SIZE) {
          toast(`${file.name}: 5MB 이하 파일만 첨부 가능합니다.`, "warning");
          continue;
        }
        if (!file.type.startsWith("image/")) {
          toast(`${file.name}: 이미지 파일만 첨부 가능합니다.`, "warning");
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
    if (!category) newErrors.category = "문의 유형을 선택해주세요.";
    if (!subject.trim()) newErrors.subject = "제목을 입력해주세요.";
    if (!content.trim()) newErrors.content = "내용을 입력해주세요.";
    if (content.length > MAX_CONTENT_LENGTH)
      newErrors.content = `${MAX_CONTENT_LENGTH}자 이하로 입력해주세요.`;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "올바른 이메일을 입력해주세요.";
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
        toast(data.error?.message ?? "문의 전송에 실패했습니다.", "error");
        return;
      }

      toast("문의가 접수되었습니다. 빠르게 답변드리겠습니다.", "success");
      setCategory("");
      setSubject("");
      setContent("");
      setEmail("");
      images.forEach(({ url }) => URL.revokeObjectURL(url));
      setImages([]);
      setErrors({});
    } catch {
      toast("문의 전송에 실패했습니다.", "error");
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
              문의하기
            </h1>
            <p className="text-muted-foreground text-sm">
              궁금한 점이나 불편한 점이 있으시면 알려주세요.
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
                문의 유형 <span className="text-error">*</span>
              </label>
              <Dropdown
                options={CATEGORIES}
                value={category}
                onChange={(val) => {
                  setCategory(val);
                  setErrors((prev) => ({ ...prev, category: "" }));
                }}
                placeholder="문의 유형을 선택해주세요"
                variant="gradient"
              />
              {errors.category && (
                <p className="mt-1.5 text-sm text-error">{errors.category}</p>
              )}
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                제목 <span className="text-error">*</span>
              </label>
              <Input
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setErrors((prev) => ({ ...prev, subject: "" }));
                }}
                placeholder="문의 제목을 입력해주세요"
                maxLength={200}
                error={errors.subject}
              />
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                내용 <span className="text-error">*</span>
              </label>
              <Textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setErrors((prev) => ({ ...prev, content: "" }));
                }}
                placeholder="문의 내용을 자세히 입력해주세요"
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
                  이메일{" "}
                  <span className="text-muted-foreground font-normal text-xs">
                    (선택 - 답변 받을 이메일)
                  </span>
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  placeholder="example@email.com"
                  error={errors.email}
                />
              </div>
            )}

            {/* 이미지 첨부 */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                이미지 첨부{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  (선택, 최대 {MAX_IMAGES}장)
                </span>
              </label>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <ImagePlus className="w-6 h-6 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-sm text-muted-foreground">
                  클릭하거나 이미지를 드래그해서 첨부
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  JPG, PNG, GIF, WebP / 5MB 이하
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
                          alt={`첨부 ${i + 1}`}
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
                답변은 <span className="text-foreground font-medium">{user.email}</span> 으로 발송됩니다
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
                  전송 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  문의 보내기
                </>
              )}
            </Button>
          </motion.form>
        </div>
      </div>
      <Footer />
    </>
  );
}
