// Xcode 26 / 최신 clang 에서 fmt 11.0.2(RCT-Folly 경유)의 consteval 포맷 문자열
// 검사가 실패하며 나는 컴파일 에러를 우회한다.
//   error: call to consteval function 'fmt::basic_format_string<...>' is not a constant expression
// fmt 헤더의 FMT_USE_CONSTEVAL 을 0으로 정의하면 FMT_CONSTEVAL 가 빈 값이 되어
// 컴파일타임 포맷 검사가 꺼진다. fmt 헤더는 다수 타깃이 include 하므로 전역 적용한다.
//
// Expo managed 워크플로우는 ios/ 폴더가 없어 prebuild 시 생성되는 Podfile 을
// withDangerousMod 로 패치한다.
const { withDangerousMod } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');
const fs = require('fs');
const path = require('path');

const SNIPPET = [
  '    installer.pods_project.targets.each do |target|',
  '      target.build_configurations.each do |bc|',
  "        defs = bc.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']",
  '        defs = [defs] unless defs.is_a?(Array)',
  "        defs << 'FMT_USE_CONSTEVAL=0' unless defs.include?('FMT_USE_CONSTEVAL=0')",
  "        bc.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs",
  '      end',
  '    end',
].join('\n');

module.exports = function withFmtConstevalFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      const contents = fs.readFileSync(podfilePath, 'utf-8');
      const result = mergeContents({
        tag: 'fmt-consteval-fix',
        src: contents,
        newSrc: SNIPPET,
        anchor: /post_install do \|installer\|/,
        offset: 1,
        comment: '#',
      });
      if (result.didMerge) {
        fs.writeFileSync(podfilePath, result.contents);
      }
      return cfg;
    },
  ]);
};
