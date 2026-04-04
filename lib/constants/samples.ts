export interface Sample {
  id: string;
  thumbnail: string;
  alt: string;
  model: string;
  prompt: string;
  inputs: string[];
  outputs: string[];
  imageSize?: string;
  ratio?: string;
  scale?: number;
  imageCount?: number;
}

export const SAMPLES: Sample[] = [
  {
    id: "1",
    thumbnail: "/images/image-edit/sample1/smaple1.webp",
    alt: "Beauty model ad",
    model: "nano-banana-pro",
    prompt: "change her pose like professional hair product model.",
    inputs: ["/images/image-edit/sample1/input1.webp"],
    outputs: [
      "/images/image-edit/sample1/output1.webp",
      "/images/image-edit/sample1/output2.webp",
      "/images/image-edit/sample1/output3.webp",
      "/images/image-edit/sample1/output4.webp",
    ],
    imageSize: "1K",
    ratio: "AUTO",
    scale: 1,
    imageCount: 1,
  },
  {
    id: "2",
    thumbnail: "/images/image-edit/sample2/smaple2.webp",
    alt: "Male model editorial",
    model: "seedream-5.0",
    prompt: "Edit figure 1 by adding sunglasses similar to those in figure 2, with a matching sleek and modern style, while retaining the rest of the composition unchanged.",
    inputs: [
      "/images/image-edit/sample2/input1.webp",
      "/images/image-edit/sample2/input2.webp",
    ],
    outputs: ["/images/image-edit/sample2/output1.webp"],
    imageSize: "2K",
    ratio: "AUTO",
    scale: 1,
    imageCount: 1,
  },
  {
    id: "3",
    thumbnail: "/images/image-edit/sample3/smaple3.webp",
    alt: "Glass jar product photo",
    model: "seedream-4.5",
    prompt: "Create an e-commerce main image for this grain storage jar, placing it in a cozy and well-lit corner of the living room with a cat sniffing it.",
    inputs: ["/images/image-edit/sample3/input1.webp"],
    outputs: [
      "/images/image-edit/sample3/output1.webp",
      "/images/image-edit/sample3/output2.webp",
      "/images/image-edit/sample3/output3.webp",
      "/images/image-edit/sample3/output4.webp",
    ],
    imageSize: "2K",
    ratio: "AUTO",
    scale: 1,
    imageCount: 4,
  },
  {
    id: "4",
    thumbnail: "/images/image-edit/sample4/smaple4.webp",
    alt: "Mouthwash product",
    model: "nano-banana-2",
    prompt: "A clean and minimalist top-view product photo of a image1 product, placed diagonally inside a rustic woven hat filled with fresh green herbs, wheat stalks, and sprigs of rosemary and mint, resting on a soft, textured olive green linen fabric. Natural sunlight casts gentle shadows over the scene, highlighting the earthy textures and creating a serene, organic wellness aesthetic.",
    inputs: ["/images/image-edit/sample4/input1.webp"],
    outputs: ["/images/image-edit/sample4/output1.webp"],
    imageSize: "1K",
    ratio: "AUTO",
    scale: 1,
    imageCount: 1,
  },
  {
    id: "5",
    thumbnail: "/images/image-edit/sample5/smaple5.webp",
    alt: "Hand cream flat lay",
    model: "seedream-4.5",
    prompt: "slightly high-angle photo of the same ivory \"Hand Cream Mango Seed Butter Muhwagwa\" tube and dark wooden massage comb placed together on a pristine white ceramic dinner plate, styled like a plated dessert on a restaurant table, a silver fork and linen napkin carefully arranged beside them, a soft ribbon of cream on the plate echoing sauce plating, set on a neutral stone tabletop, warm ambient restaurant lighting with a gentle spotlight from above, soft but noticeable shadows, subtle surreal editorial still life, keep original packaging design and label legible, sophisticated yet playful mood",
    inputs: ["/images/image-edit/sample5/input1.webp"],
    outputs: [
      "/images/image-edit/sample5/output1.webp",
    ],
    imageSize: "2K",
    ratio: "AUTO",
    scale: 1,
    imageCount: 1,
  },
  {
    id: "6",
    thumbnail: "/images/image-edit/sample6/smaple6.webp",
    alt: "Skincare cream product",
    model: "seedream-4.5",
    prompt: "A dynamic low-angle commercial product(image1) shot placed on a transparent blue acrylic platform, seen from below so the underside and edges of the platform are visible, water pouring down from above and splashing around the jar, frozen droplets suspended in mid-air, streams of water dripping off the acrylic into a glossy blue water surface, set against a clean solid sky-blue background, bright studio lighting with high-speed flash freezing the motion and creating crisp reflections on the wet surfaces, ultra sharp focus with subtle depth of field, modern skincare advertisement style, hyper realistic, 8k product photography, clean and refreshing aesthetic.",
    inputs: ["/images/image-edit/sample6/input1.webp"],
    outputs: ["/images/image-edit/sample6/output1.webp"],
    imageSize: "2K",
    ratio: "AUTO",
    scale: 1,
    imageCount: 1,
  },
];
