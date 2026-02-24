export interface Sample {
  id: string;
  thumbnail: string;
  alt: string;
  inputs: string[];
  outputs: string[];
}

export const SAMPLES: Sample[] = [
  {
    id: "1",
    thumbnail: "/images/image-edit/sample1/smaple1.png",
    alt: "유리컵 제품 사진",
    inputs: ["/images/image-edit/sample1/input1.jpg"],
    outputs: [
      "/images/image-edit/sample1/output1.jpg",
      "/images/image-edit/sample1/output2.jpg",
      "/images/image-edit/sample1/output3.jpg",
      "/images/image-edit/sample1/output4.jpg",
    ],
  },
  {
    id: "2",
    thumbnail: "/images/image-edit/sample2/smaple2.jpg",
    alt: "남성 모델 화보",
    inputs: [
      "/images/image-edit/sample2/input1.jpg",
      "/images/image-edit/sample2/input2.jpg",
    ],
    outputs: ["/images/image-edit/sample2/output1.jpg"],
  },
  {
    id: "3",
    thumbnail: "/images/image-edit/sample3/smaple3.jpg",
    alt: "스킨케어 크림 제품",
    inputs: ["/images/image-edit/sample3/input1.jpg"],
    outputs: [
      "/images/image-edit/sample3/output1.jpg",
      "/images/image-edit/sample3/output2.jpg",
      "/images/image-edit/sample3/output3.jpg",
    ],
  },
  {
    id: "4",
    thumbnail: "/images/image-edit/sample4/smaple4.jpg",
    alt: "뷰티 모델 광고",
    inputs: ["/images/image-edit/sample4/input1.png"],
    outputs: [
      "/images/image-edit/sample4/output1.jpg",
      "/images/image-edit/sample4/output2.jpg",
      "/images/image-edit/sample4/output3.jpg",
      "/images/image-edit/sample4/output4.jpg",
    ],
  },
  {
    id: "5",
    thumbnail: "/images/image-edit/sample5/smaple5.png",
    alt: "핸드크림 플랫레이",
    inputs: ["/images/image-edit/sample5/input1.jpg"],
    outputs: [
      "/images/image-edit/sample5/output1.jpg",
      "/images/image-edit/sample5/output2.jpg",
    ],
  },
  {
    id: "6",
    thumbnail: "/images/image-edit/sample6/smaple6.jpg",
    alt: "구강청결제 제품",
    inputs: ["/images/image-edit/sample6/input1.jpg"],
    outputs: ["/images/image-edit/sample6/output1.jpg"],
  },
];
