// Deploy on the retired Sites origin only. Legacy query parameters describe
// a different experiment, so every old URL leads to the current introduction.
export default {
  fetch() {
    return new Response(null, {
      status: 308,
      headers: {
        Location: 'https://randomness-for-style.vercel.app/',
        'Cache-Control': 'public, max-age=300',
      },
    });
  },
};
