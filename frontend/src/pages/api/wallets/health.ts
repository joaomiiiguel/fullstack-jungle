// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  try {
    const response = await fetch('http://localhost:4001/health');
    if (!response.ok) throw new Error('Falha na rede');
    res.status(200).json(await response.json());
  } catch (e) {
    console.error(e);
    throw e;
  }
}
