import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    countries: 'src/data/countries.ts',
    'phone-data': 'src/data/phone-data.ts',
    address: 'src/address.ts',
    phone: 'src/phone.ts',
    tax: 'src/tax.ts',
    divisions: 'src/divisions.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: false,
  clean: true,
  treeshake: true,
  minify: false,
});
