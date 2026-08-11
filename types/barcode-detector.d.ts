interface DetectedBarcode { rawValue: string; }
interface BarcodeDetector {
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>;
}
declare const BarcodeDetector: {
  new (options?: { formats?: string[] }): BarcodeDetector;
  getSupportedFormats?(): Promise<string[]>;
};
