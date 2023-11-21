import { $, chalk, spinner } from 'zx'
import { input } from '@inquirer/prompts'
import fs from 'fs'

// 获取当前最新的tag
export async function getCurTag() {
  const { stdout: curTagStdout } = await $`git describe --tags $(git rev-list --tags --max-count=1)`
  const curTag = curTagStdout.trim()
  return curTag
}

// 判断git flow是否初始化
export function isGitFlowInit() {
  const gitConfigPath = '.git/config'
  try {
    const gitConfig = fs.readFileSync(gitConfigPath, 'utf-8')
    return gitConfig.includes('[gitflow "branch"]')
  } catch (err) {
    return false
  }
}

export function getNewVersion(currentVersion, branchType) {
  if (branchType === 'release') {
    const versionParts = currentVersion.split('.')
    versionParts[1] = parseInt(versionParts[1]) + 1
    return versionParts.join('.')
  } else if (branchType === 'hotfix') {
    const versionParts = currentVersion.split('.')
    versionParts[2] = parseInt(versionParts[2]) + 1
    return versionParts.join('.')
  } else {
    return currentVersion
  }
}

export async function getVersion(curTag, branchType) {
  const version = await input({
    name: 'version',
    message: `请输入版本号: (当前版本=> ${chalk.greenBright(curTag)})`,
    default: getNewVersion(curTag, branchType),
  })
  return version
}

export function validateVersion(version) {
  const semverRegex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

  return semverRegex.test(version)
}

export async function pullOrigin() {
  const curBranch = await $`git rev-parse --abbrev-ref HEAD`
  console.log(chalk.greenBright('正在拉取develop、master分支最新代码...'))
  await $`git checkout develop`
  await $`git pull origin develop`
  await $`git checkout master`
  await $`git pull origin master`
  await $`git checkout ${curBranch}`
}

export function getPackageName() {
  try {
    const data = fs.readFileSync('package.json', 'utf8')
    const packageJson = JSON.parse(data)
    return packageJson.name || 'git flow'
  } catch (e) {
    console.log('e', e)
  }
}
