

function runFIFO(pages, n) {
  const frames = Array(n).fill(null);
  const queue  = [];
  const steps  = [];

  for (const page of pages) {
    if (frames.includes(page)) {
      // Page already resident — hit, no eviction, queue order unchanged
      steps.push({ frames: [...frames], hit: true, replaced: -1, queue: [...queue] });
    } else {
      let slot;
      if (frames.includes(null)) {
        // Free frame available — no eviction needed yet
        slot = frames.indexOf(null);
      } else {
        // Evict the oldest page in the queue (front of the line)
        const evict = queue.shift();
        slot = frames.indexOf(evict);
      }
      frames[slot] = page;
      queue.push(page);
      steps.push({ frames: [...frames], hit: false, replaced: slot, queue: [...queue] });
    }
  }

  return steps;
}
