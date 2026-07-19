

function runLRU(pages, n) {
  const frames = Array(n).fill(null);
  const stack  = [];
  const steps  = [];

  for (const page of pages) {
    if (frames.includes(page)) {
      // Page already resident — hit, bump it to the most-recently-used end
      const si = stack.indexOf(page);
      if (si !== -1) stack.splice(si, 1);
      stack.push(page);
      steps.push({ frames: [...frames], hit: true, replaced: -1, queue: [...stack] });
    } else {
      let slot;
      if (frames.includes(null)) {
        // Free frame available — no eviction needed yet
        slot = frames.indexOf(null);
      } else {
        // Evict the least recently used page (front of the stack)
        const evict = stack.shift();
        slot = frames.indexOf(evict);
      }
      frames[slot] = page;
      stack.push(page);
      steps.push({ frames: [...frames], hit: false, replaced: slot, queue: [...stack] });
    }
  }

  return steps;
}
