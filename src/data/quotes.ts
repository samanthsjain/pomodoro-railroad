export const motivationalQuotes = [
  {
    text: "The journey of a thousand miles begins with a single step.",
    author: "Lao Tzu"
  },
  {
    text: "Focus on the journey, not the destination.",
    author: "Greg Anderson"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "Deep work is the ability to focus without distraction on a cognitively demanding task.",
    author: "Cal Newport"
  },
  {
    text: "It is not that we have a short time to live, but that we waste a lot of it.",
    author: "Seneca"
  },
  {
    text: "The successful warrior is the average person, with laser-like focus.",
    author: "Bruce Lee"
  },
  {
    text: "Concentrate all your thoughts upon the work at hand.",
    author: "Alexander Graham Bell"
  },
  {
    text: "Where focus goes, energy flows.",
    author: "Tony Robbins"
  },
  {
    text: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar"
  },
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain"
  },
  {
    text: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma"
  },
  {
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney"
  },
  {
    text: "Do not wait; the time will never be 'just right.'",
    author: "Napoleon Hill"
  },
  {
    text: "What you do today can improve all your tomorrows.",
    author: "Ralph Marston"
  },
  {
    text: "A train station is where a train stops. A desk is where a work station is.",
    author: "Unknown"
  },
  {
    text: "Life is like a journey on a train, enjoy the ride.",
    author: "Unknown"
  },
  {
    text: "Rest when you're weary. Refresh and renew yourself.",
    author: "Ralph Marston"
  },
  {
    text: "Almost everything will work again if you unplug it for a few minutes.",
    author: "Anne Lamott"
  },
  {
    text: "Take rest; a field that has rested gives a bountiful crop.",
    author: "Ovid"
  },
  {
    text: "The time to relax is when you don't have time for it.",
    author: "Sydney J. Harris"
  },
];

export function getRandomQuote() {
  return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
}
