Ganti kode dibawah ini dalam file package.json

  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "clean": "rm -rf dist",
    "lint": "tsc --noEmit"
  },

  Menjadi

    "scripts": {
    "dev": "vite --port=80 --host=ilhamzainuri.tpsiv",
    "build": "vite build",
    "preview": "vite preview",
    "clean": "rm -rf dist",
    "lint": "tsc --noEmit"
  },
