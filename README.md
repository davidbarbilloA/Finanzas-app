# FinanzasPro – Gestor de finanzas personales

Aplicación web para registrar ingresos y gastos, controlar un presupuesto y consultar el resumen financiero por usuario, con un panel de administración global. Funciona solo en el navegador: los datos se guardan en `localStorage`, sin backend ni base de datos externa.

> Es un proyecto de demostración: las contraseñas se guardan sin cifrar en el navegador. No lo uses con datos reales.

## Tech stack

| Capa | Tecnologías |
|------|-------------|
| **Lógica** | JavaScript (sin framework) |
| **Interfaz** | HTML5, CSS3, Bootstrap 5, Bootstrap Icons |
| **Gráficos** | Chart.js |
| **Persistencia** | `localStorage` y `sessionStorage` |

## Estructura del proyecto

```text
Finanzas-app/
├── documentos/         # Material de apoyo del proyecto (PDF)
├── styles/
│   └── styles.css      # Estilos propios
├── index.html          # Vistas de autenticación, usuario y administrador
├── script.js           # Datos iniciales, autenticación, movimientos y gráficos
└── README.md
```

## Funcionalidades

- **Registro e inicio de sesión** con roles de usuario y administrador
- **Movimientos**: registrar y eliminar ingresos y gastos
- **Resumen**: saldo, ingresos y gastos totales
- **Presupuesto**: barra de progreso y aviso antes de registrar un gasto que lo excede
- **Categorías** propias de cada usuario y filtro de movimientos por categoría
- **Gráfico de dona** con la distribución del usuario
- **Panel de administración**: indicadores globales, estado de cada usuario y gráfico de barras
- **Exportación a CSV** del reporte de usuarios

## Sistema de roles

| Rol | Permisos principales | Datos que ve |
|-----|----------------------|--------------|
| **user** | Registrar movimientos, ajustar presupuesto y gestionar categorías | Solo los suyos |
| **admin** | Consultar indicadores y exportar el reporte | Todos los usuarios |

## Modelo de datos

Claves en `localStorage`:

- `finpro_users`: usuarios, con rol, presupuesto y categorías
- `finpro_moves`: movimientos

La sesión activa se guarda en `sessionStorage`, con la clave `finpro_session`.

Relaciones:

```text
User 1 ── * Movimiento
```

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/davidbarbilloA/Finanzas-app.git
cd Finanzas-app
```

### 2. Abrir la aplicación

No requiere instalación ni compilación: abre `index.html` en el navegador. Necesitas conexión a internet porque Bootstrap y Chart.js se cargan desde un CDN.

## Usuarios de prueba

Se crean automáticamente la primera vez que abres la aplicación:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `123` | Administrador |
| `demo` | `123` | Usuario |

## Flujo típico de uso

1. El **usuario** se registra o entra con la cuenta `demo`.
2. Registra sus movimientos y revisa el saldo, el presupuesto y el gráfico.
3. El **administrador** consulta el estado de los usuarios y exporta el reporte en CSV.

## Autor

- [@davidbarbilloA](https://github.com/davidbarbilloA)
