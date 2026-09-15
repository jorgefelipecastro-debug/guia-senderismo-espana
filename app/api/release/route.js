export const dynamic = 'force-dynamic';

export async function GET() {
  const release =
    process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 12) ||
    process.env.GITHUB_SHA?.slice(0, 12) ||
    'local';

  return Response.json(
    { release },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-Release': release,
      },
    },
  );
}
