import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { input } = req.body;
  const inputString = input as string;
  console.log(inputString);

  const { Configuration, OpenAIApi } = require("openai");
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const prompt = `
次のテキストから、「価格」と「ジャンル（和食・洋食・中華 のいずれか）」を抽出してください。出力はJSONで
======================
${inputString}
======================

# Example_1
-----
価格: 500円以上、1000円以下
ジャンル: 和食
{
  "price_less_than": 1000,
  "price_greater_than": 500,
  "genre": "和食"
}
-----

# Example_2
-----
価格: 2000円以下
ジャンル: 和食
{
  "price_less_than": 2000,
  "genre": "和食"
}
-----

# Example_3
-----
価格: 指定なし
ジャンル: 和食
{
  "genre": "和食"
}
-----

# Output
`;

  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });

  const content = response.data.choices[0]["message"]["content"];
  console.log(content);

  res.status(200).json({ content });
}
