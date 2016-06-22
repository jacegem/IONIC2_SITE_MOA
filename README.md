# IONIC2_SITE_MOA

## 설치

`nodejs`가 설치된 상태에서 시작합니다. 4.x 버전으로 설치합니다. 

```sh
npm install -g cordova ionic@beta
```
ionic2 를 사용하기 위해서 `ionic@beta` 로 설치 합니다. 

## 시작
```sh
ionic start sitemoa sidemenu --v2
```

## Plugin

### admobpro
```sh
ionic plugin add cordova-plugin-admobpro
```

### inappbrowser
```sh
ionic plugin add cordova-plugin-inappbrowser
```

### whitelist
```sh
ionic plugin add cordova-plugin-whitelist
```

## 서버 시작
```sh
ionic serve
```

## 빌드
```sh
ionic build android
```

플랫폼이 추가 되어 있지 않은 경우, 플랫폼 추가 질문이 나옵니다. 아래 명령어를 통해 설치도 가능합니다. 
```sh
ionic platform add android
```

`ios` 의 경우 `android` 자리에 대신 적으면 됩니다. 



### 참고
- https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html#foreground.type=image&foreground.space.trim=1&foreground.space.pad=0.1&foreColor=fff%2C0&crop=0&backgroundShape=square&backColor=bde2f6%2C100&effects=score


