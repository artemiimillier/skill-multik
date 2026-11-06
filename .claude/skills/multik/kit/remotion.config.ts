import {Config} from '@remotion/cli/config';

// Кадры PNG без потерь: тонкие линии сетки и точечные тени иначе «плывут» в JPEG.
Config.setVideoImageFormat('png');
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer('angle');
Config.setEntryPoint('src/index.ts');
