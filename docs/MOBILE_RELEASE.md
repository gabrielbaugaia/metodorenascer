# Publicacao mobile

Este projeto usa Vite/React como web app e Capacitor para empacotar Android e iOS.

## Identidade do app

- Nome: `Renascer Connect`
- Android package / iOS bundle id: `com.renascer.connect`
- Versao inicial: `1.0`
- Android minSdk: `26`, exigido pelo plugin `@capgo/capacitor-health`

Nao mude `com.renascer.connect` depois de criar o app nas lojas, a menos que queira publicar como outro app.

## Build local no Windows

1. Instale as dependencias:

   ```sh
   npm ci
   ```

2. Gere web + sync nativo:

   ```sh
   npm run mobile:sync
   ```

3. Para Android neste PC, use o JDK interno do Android Studio:

   ```powershell
   $env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
   cd android
   .\gradlew.bat bundleRelease
   ```

4. O bundle Android sai em:

   ```text
   android/app/build/outputs/bundle/release/app-release.aab
   ```

O arquivo `android/local.properties` aponta para o SDK Android local e nao deve ser commitado.

## Parte manual do Google Play

1. Crie o app no Google Play Console.
2. Use o package name `com.renascer.connect`.
3. Configure Play App Signing.
4. Gere ou envie uma keystore de release. Guarde uma copia fora do repositorio.
5. Suba o `.aab` em teste interno antes de producao.
6. Preencha classificacao indicativa, seguranca de dados, privacidade, screenshots e politicas.

Para Codemagic, envie a keystore em Team settings > codemagic.yaml settings > Code signing identities > Android keystores com a referencia:

```text
renascer_connect_release
```

O Codemagic injeta `CM_KEYSTORE_PATH`, `CM_KEYSTORE_PASSWORD`, `CM_KEY_ALIAS` e `CM_KEY_PASSWORD`, e o Gradle usa essas variaveis para assinar o release.

## Visualizacao no Codemagic

Para ver o app rodando dentro do Codemagic, rode o workflow:

```text
Android Preview (Metodo Renascer)
```

Esse workflow gera:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

No Codemagic, os workflows Android criam `android/local.properties` automaticamente e instalam `platforms;android-36` antes de chamar o Gradle. Isso evita falhas quando a maquina de build nao vem com o mesmo SDK Android instalado no PC local.

Depois que a build terminar, abra a pagina da build no Codemagic e procure o artefato `.apk`. Se o recurso App Preview estiver habilitado para sua equipe, aparece o botao `Quick Launch` ao lado do APK. Clique nele para abrir o emulador Android no navegador.

Observacao: segundo a documentacao atual do Codemagic, o App Preview no navegador fica disponivel para equipes. Em conta pessoal, o caminho mais simples e baixar o `.apk` gerado e instalar em um aparelho Android ou emulador local.

O workflow de publicacao `Android Release (Metodo Renascer)` gera `.aab`, que e para Google Play, nao para preview rapido no Codemagic.

## Parte manual da Apple

iOS precisa de macOS/Xcode ou de um CI macOS como Codemagic.

1. Entre no Apple Developer Program.
2. Crie o Bundle ID `com.renascer.connect`.
3. Crie o app no App Store Connect.
4. Configure certificado Apple Distribution e provisioning profile App Store.
5. No Codemagic, configure a integracao App Store Connect e o iOS code signing para `com.renascer.connect`.
6. Rode o workflow `iOS Release (Metodo Renascer)` para gerar o `.ipa`.
7. Envie primeiro para TestFlight, teste em aparelho real e depois submeta para revisao.

## Push notifications

O projeto tem `@capacitor/push-notifications`, mas o Android so aplica Firebase quando existir:

```text
android/app/google-services.json
```

Esse arquivo contem configuracao sensivel e esta no `.gitignore`.
