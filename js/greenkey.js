// Панда поверх живой камеры (Юрий 26.11): ролик снят на ровном зелёном фоне, зелёный вырезается здесь же на телефоне (WebGL).
// Работает в Safari iOS и Chrome Android; без WebGL — показываем ролик как есть (зелёный фон виден, но упражнение понятно).
const VS = 'attribute vec2 p; varying vec2 uv; void main(){ uv = vec2((p.x+1.0)/2.0, 1.0-(p.y+1.0)/2.0); gl_Position = vec4(p,0.0,1.0); }';
// Ключ по «зелёности»: насколько зелёный выше max(красный, синий). Мягкий край и подавление зелёного ореола.
const FS = `precision mediump float; varying vec2 uv; uniform sampler2D t; uniform vec4 box;
void main(){
  vec2 q = (uv - box.xy) / box.zw;
  if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) { gl_FragColor = vec4(0.0); return; }
  vec4 c = texture2D(t, q);
  float g = c.g - max(c.r, c.b);
  float a = 1.0 - smoothstep(0.08, 0.22, g);
  vec3 col = c.rgb; col.g = min(col.g, max(col.r, col.b) + 0.04);
  gl_FragColor = vec4(col * a, a);
}`;

export function greenOverlay(canvas, video, box = null) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const boxU = gl.getUniformLocation(pr, 'box');
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  let raf = 0, stopped = false;
  const draw = () => {
    if (stopped) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    if (video.readyState >= 2 && video.videoWidth) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      // Вписываем не весь кадр, а саму панду (box из CONFIG.exercises[].gBox): во всех упражнениях она одинаково крупная (Юрий 26.11)
      const [x0, y0, x1, y1] = box || [0, 0, 1, 1];
      const vw = video.videoWidth, vh = video.videoHeight, m = 0.02;
      const cw = (x1 - x0) * vw, ch = (y1 - y0) * vh;
      const sc = Math.min((w * (1 - 2 * m)) / cw, (h * (1 - 2 * m)) / ch);
      const tw = (vw * sc) / w, th = (vh * sc) / h; // весь кадр ролика в долях холста
      const ox = 0.5 - ((x0 + x1) / 2) * tw, oy = 0.5 - ((y0 + y1) / 2) * th;
      gl.uniform4f(boxU, ox, oy, tw, th);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    raf = requestAnimationFrame(draw);
  };
  draw();
  return () => { stopped = true; cancelAnimationFrame(raf); };
}
