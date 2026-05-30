# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Como gerar as versões mobile (iOS/Android)?

Este projeto utiliza **Capacitor** para converter a aplicação web em aplicativos nativos.

### Pré-requisitos
- **Android:** Android Studio instalado.
- **iOS:** Xcode instalado (necessário macOS).

### Passo a Passo para Build

1. **Instale as dependências:**
   ```sh
   npm install
   ```

2. **Gere a build de produção:**
   ```sh
   npm run build
   ```

3. **Sincronize com as plataformas nativas:**
   ```sh
   npx cap sync
   ```

4. **Abra o projeto na IDE nativa:**
   - Para Android: `npx cap open android`
   - Para iOS: `npx cap open ios`

5. **Execute/Gere o APK/IPA:**
   Dentro do Android Studio ou Xcode, você poderá rodar o app em um simulador ou gerar o arquivo final para publicação.

## Como este projeto foi otimizado para Mobile?

Foram realizados diversos ajustes para garantir uma experiência nativa:
- **Persistência de Sessão:** Migração do `localStorage` para `Capacitor Preferences` para garantir que o login não seja perdido ao fechar o app.
- **Safe Areas:** Ajustes de layout (Header, Navbar, Modais) para respeitar o entalhe (notch) e a barra de gestos do iPhone/Android.
- **Integração Nativa:** Configuração de plugins para Notificações Push, Status Bar e Browser interno (InAppBrowser) para pagamentos e links externos.
- **UI Otimizada:** Ajustes no comportamento do teclado em formulários e melhorias em modais para telas menores.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
