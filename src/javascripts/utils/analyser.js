export function getFrequencyBinCount(analyser) {
  return analyser.frequencyBinCount;
}

export function getNormalizedFrequencyData (analyser) {
  const data = getByteFrequencyData(analyser);
  if (data && data.length) {
    const length = data.length;
    const result = {
      average: 0,
      bins: [],
      max: 0,
      min: 255
    };

    const nBins = 8;
    const nPerBin = length / nBins;

    let strength = 0;
    for (let i = 0; i < length; i++){
      const n = Math.floor(i / nPerBin);
      if (!result.bins[n]){
        result.bins[n] = data[i];
      } else {
        result.bins[n] += data[i];
      }


      if (data[i] > result.max) {
        result.max = data[i];
      }
      if (data[i] < result.min) {
        result.min = data[i];
      }
      strength += data[i];
    }

    for (let i = 0; i < result.bins.length; i++){
      result.bins[i] = result.bins[i] / 255 / nPerBin;
    }
    result.max /= 255;
    result.min /= 255;
    result.average = (strength / 255) / length;
    return result;
  }
}

export function getByteFrequencyData (analyser) {
  const bufferLength = analyser.frequencyBinCount;
  const data = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(data);
  return data;
}

export function getByteTimeDomainData (analyser) {
  const bufferLength = analyser.frequencyBinCount;
  const data = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(data);
  return data;
}
