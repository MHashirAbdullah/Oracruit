import Vapi from '@vapi-ai/web';
export const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_API_KEY!);
if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_API_KEY) {
  throw new Error('VAPI API key is not set in NEXT_PUBLIC_VAPI_PUBLIC_API_KEY');
}
