# Sistema de turnos para laboratorio clinico

Proyecto academico con backend en Python Flask y frontend en Angular, inspirado en el flujo de atencion por turnos de un banco.

## Funciones

- Generar turnos con formato `A01`, `A02`, `A03`.
- Cola de espera para clientes.
- 4 ventanillas de atencion.
- Pantalla de clientes: genera turno y muestra cola/turnos en atencion.
- Pantalla de ventanillas: asigna el siguiente turno y finaliza atenciones.
- Sonido cuando una ventanilla queda disponible.
- API Flask con endpoints REST.
- Configuracion base para publicar el frontend en Vercel.

## Ejecutar backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

El backend queda en `http://localhost:5000`.

## Ejecutar frontend

```bash
cd frontend
npm install
npm start
```

El frontend queda en `http://localhost:4200`.

Rutas:

- `http://localhost:4200/clientes`
- `http://localhost:4200/ventanillas`

## Subir a Git

```bash
git init
git add .
git commit -m "Sistema de turnos para laboratorio clinico"
git branch -M main
git remote add origin URL_DEL_REPOSITORIO
git push -u origin main
```

## Desplegar en Vercel

1. Subir este proyecto a GitHub.
2. Entrar a Vercel e importar el repositorio.
3. Configurar:
   - Framework Preset: Angular
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist/laboratorio-turnos/browser`

Nota: Vercel publica muy bien el frontend. Para una entrega real, el backend Flask debe publicarse en Render, Railway, Fly.io u otro servicio Python, y luego configurar la URL del backend en el frontend.
