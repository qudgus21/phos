"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    question: "크레딧은 어떻게 사용되나요?",
    answer:
      '기능과 모델에 따라 크레딧이 다르게 차감됩니다. <strong>이미지 편집</strong>은 모델·해상도에 따라 25~230 크레딧, <strong>피부보정</strong>은 110 크레딧, <strong>얼굴 변경</strong>은 40 크레딧이 사용됩니다. 생성 전 필요한 크레딧을 미리 확인할 수 있습니다.',
  },
  {
    question: "플랜별로 어떤 차이가 있나요?",
    answer:
      '<strong>Free</strong>는 5분 쿨타임과 1장씩 생성, <strong>Basic</strong>부터 쿨타임 없이 4장까지 동시 생성이 가능합니다. 즐겨찾기 저장 개수도 플랜에 따라 달라집니다 (Free 3개, Basic 10개, Pro 20개, Premium 무제한).',
  },
  {
    question: "월 중간에 플랜을 변경하면 어떻게 되나요?",
    answer:
      '<strong>업그레이드 시 즉시 적용</strong>되며 남은 기간에 비례한 차액만 청구됩니다. <strong>다운그레이드는 다음 결제 주기부터 적용</strong>되어 현재 주기 동안은 기존 플랜을 계속 이용할 수 있습니다.',
  },
  {
    question: "월구독 크레딧과 단건구매 크레딧의 차이점은?",
    answer:
      '<strong>월구독 크레딧</strong>은 구독 종료 시 소멸되지만, <strong>단건구매 크레딧</strong>은 영구 보관됩니다. 사용 시 단건구매 크레딧부터 먼저 차감되어 영구 크레딧을 효율적으로 활용할 수 있습니다.',
  },
  {
    question: "구독을 취소하면 크레딧은 어떻게 되나요?",
    answer:
      '구독을 취소해도 <strong>남은 크레딧은 소멸되지 않습니다</strong>. 기존 크레딧은 그대로 유지되며, 다음 결제 주기부터 새로운 크레딧 충전만 중단됩니다.',
  },
  {
    question: "생성된 이미지의 저작권은 누구에게 있나요?",
    answer:
      '이용자가 생성한 이미지의 <strong>저작권은 이용자</strong>에게 있습니다. 단, 불법적이거나 부적절한 용도로 사용해서는 안 되며, 상업적 이용 시 관련 법규를 준수해야 합니다.',
  },
  {
    question: "결제 방법과 보안은 어떻게 되나요?",
    answer:
      '<strong>Polar</strong>를 통해 신용카드, 디지털 월렛 등 다양한 결제 방법을 안전하게 지원합니다. 모든 결제 정보는 암호화 처리됩니다.',
  },
  {
    question: "환불 정책은 어떻게 되나요?",
    answer:
      '<strong>사용하지 않은 크레딧</strong>과 서비스에 대해서는 이용약관에 따라 환불이 가능합니다. 구체적인 환불 조건은 고객센터로 문의해주세요.',
  },
];

function FaqAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border transition-colors",
        isOpen ? "bg-card" : "bg-card/60"
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-7 py-5 cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="text-[18px] font-semibold text-foreground text-left">
          {item.question}
        </span>
        <span
          className={cn(
            "text-primary text-base font-semibold transition-transform duration-200 shrink-0 ml-4",
            isOpen ? "rotate-180" : ""
          )}
        >
          ▼
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-7 pb-5 pt-0">
              <p
                className="text-base text-muted-foreground leading-relaxed [&_strong]:text-primary [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{ __html: item.answer }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PricingFaq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="max-w-[720px] mx-auto px-4 py-20"
    >
      <motion.h3
        variants={fadeInUp}
        className="text-[32px] font-bold text-foreground text-center mb-10"
      >
        자주 묻는 질문
      </motion.h3>

      <motion.div variants={fadeInUp} className="space-y-3">
        {faqItems.map((item, idx) => (
          <FaqAccordionItem
            key={item.question}
            item={item}
            isOpen={openIndex === idx}
            onToggle={() => setOpenIndex(openIndex === idx ? -1 : idx)}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
