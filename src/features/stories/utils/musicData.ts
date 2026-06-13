export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverUrl: string;
  category: string;
  duration: string;
}

export const CATEGORIES = ['All', 'Chill', 'Pop', 'Vibe', 'Romantic', 'Inspiring'];

export const TRACKS: Track[] = [
  {
    id: 'track_1',
    title: 'Warm Sunset Glow',
    artist: 'Lofi Dreamer',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=150&q=80',
    category: 'Chill',
    duration: '6:12'
  },
  {
    id: 'track_2',
    title: 'Neon Skyline Run',
    artist: 'Retro Synthwave',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1515462277126-270d878326e5?w=150&q=80',
    category: 'Vibe',
    duration: '7:05'
  },
  {
    id: 'track_3',
    title: 'Summer Acoustic Smile',
    artist: 'Sunny Breeze',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&q=80',
    category: 'Pop',
    duration: '5:44'
  },
  {
    id: 'track_4',
    title: 'Soft Rainy Window',
    artist: 'Piano Sanctuary',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1437419764061-2473afe69fc2?w=150&q=80',
    category: 'Romantic',
    duration: '5:02'
  },
  {
    id: 'track_5',
    title: 'Cyber Drift',
    artist: 'Arcade Kid',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150&q=80',
    category: 'Vibe',
    duration: '6:03'
  },
  {
    id: 'track_6',
    title: 'Deep Focus Morning',
    artist: 'Ambient Space',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=150&q=80',
    category: 'Chill',
    duration: '5:28'
  },
  {
    id: 'track_7',
    title: 'Inspiring Ascent',
    artist: 'Cinematic Dream',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=150&q=80',
    category: 'Inspiring',
    duration: '5:18'
  }
];
