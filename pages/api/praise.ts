import { OpenAIStream } from "@/utils/OpenAIStream";
import { NextRequest } from "next/server";

type ChatGPTAgent = "user" | "system" | "assistant";

export interface ChatGPTMessage {
  role: ChatGPTAgent;
  content: string;
}

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  const { priceLessThan, priceGreaterThan, genre, input } =
    (await req.json()) as {
      priceLessThan: number;
      priceGreaterThan: number;
      genre: string;
      input: string;
    };

  console.log("genre", genre);
  console.log("priceGreaterThan", priceGreaterThan);
  console.log("priceLessThan", priceLessThan);

  const parameterStrings: string[] = [];

  if (genre) {
    parameterStrings.push(`genre[contains]${genre}`);
  }
  if (priceGreaterThan) {
    parameterStrings.push(`price[greater_than]${priceGreaterThan}`);
  }
  if (priceLessThan) {
    parameterStrings.push(`price[less_than]${priceLessThan}`);
  }
  const filterString = parameterStrings.join("[and]");

  // microCMS JS SDKを使ってデータを取得する
  const { createClient } = require("microcms-js-sdk");
  const client = createClient({
    serviceDomain: "room-service-him",
    apiKey: process.env.MICROCMS_API_KEY,
  });

  // 金額、ジャンルでフィルタする
  const data = await client.get({
    endpoint: "menus",
    queries: {
      filters: filterString,
    },
  });

  console.log(data);

  const menuStrings = data.contents.map((menu: any) => {
    return `メニュー名: ${menu.name}
ジャンル: ${menu.genre}
価格: ${menu.price}円
特徴: ${menu.description}
----------
`;
  });
  console.log(menuStrings);

  const prompt = `あなたはユーザーの質問に答えるアシスタントです。
  ルームサービスのメニューについての質問に答えてください。メニューの特徴を添えると喜ばれます。

  メニューの情報:
  =============
  ${menuStrings.join("\n")}

  ユーザーからの質問:
  =============
  ${input}

  アシスタントの回答:
  `;

  const messages: ChatGPTMessage[] = [];
  messages.push({ role: "user", content: prompt });

  const payload = {
    model: "gpt-3.5-turbo",
    messages: messages,
    temperature: process.env.AI_TEMP ? parseFloat(process.env.AI_TEMP) : 0.7,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stream: true,
    n: 1,
  };

  const stream = await OpenAIStream(payload);

  return new Response(stream);
}
