import Globe from 'globe.gl';

fetch('/world.geojson')
  .then(res => res.json())
  .then(geoJson => {
    const features = geoJson.features;

    // Compute log densities
    const logDensities = features
      .map(d => {
        const { timezones, area } = d.properties;
        if (!timezones || !area || area <= 0) return null;
        const density = timezones / area;
        return Math.log10(density + 1e-12);
      })
      .filter(v => v !== null);

    const minLog = Math.min(...logDensities);
    const maxLog = Math.max(...logDensities);

    // Create globe with visible Earth texture
    const world = Globe()(document.getElementById('globeViz'))
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .polygonsData(features)
      .polygonCapColor(d => {
        const { timezones, area } = d.properties;
        if (!timezones || !area || area <= 0) return 'rgba(180, 180, 180, 0.3)';
        const density = timezones / area;
        const logDensity = Math.log10(density + 1e-12);
        const norm = Math.min(1, Math.max(0, (logDensity - minLog) / (maxLog - minLog)));
        const h = 200 + (30 - 200) * norm;
        const s = 90;
        const l = 70 - norm * 40;
        return `hsl(${h}, ${s}%, ${l}%)`;
      })
      .polygonSideColor(() => 'rgba(50, 50, 50, 0.5)')
      .polygonStrokeColor(() => '#222')
      .polygonAltitude(d => {
        const { timezones, area } = d.properties;
        if (!timezones || !area || area <= 0) return 0.01;
        const density = timezones / area;
        const logDensity = Math.log10(density + 1e-12);
        const norm = Math.min(1, Math.max(0, (logDensity - minLog) / (maxLog - minLog)));
        return 0.01 + norm * 0.3;
      })
      .polygonLabel(d => {
        const { name, timezones, area } = d.properties;
        const density = timezones && area ? (timezones / area).toExponential(3) : 'N/A';
        return `
          <b>${name}</b><br>
          Timezones: ${timezones ?? 'N/A'}<br>
          Area: ${area?.toLocaleString?.()} sq km<br>
          Density: ${density}
        `;
      });

    // Track tooltip position
    document.addEventListener('mousemove', ev => {
      const label = document.getElementById('hoverLabel');
      if (label) {
        label.style.left = `${ev.pageX + 10}px`;
        label.style.top = `${ev.pageY + 10}px`;
      }
    });

  

    // --- Toggle country shapes with 'S' key ---
    let showShapes = true;

    function toggleShapes() {
      showShapes = !showShapes;

      if (showShapes) {
        world
          .polygonsData(features)
          .polygonAltitude(d => {
            const { timezones, area } = d.properties;
            if (!timezones || !area || area <= 0) return 0.01;
            const density = timezones / area;
            const logDensity = Math.log10(density + 1e-12);
            const norm = Math.min(1, Math.max(0, (logDensity - minLog) / (maxLog - minLog)));
            return 0.01 + norm * 0.3;
          });
      } else {
        world
          .polygonsData([]) // Hide all shapes
          .polygonAltitude(() => 0);
      }
    }

    document.addEventListener('keydown', e => {
      if (e.key.toLowerCase() === 's') {
        toggleShapes();
      }
    });
  });
