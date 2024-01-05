import { $, chalk } from 'zx'
import { input } from '@inquirer/prompts'
import fs from 'fs'
import path from 'path'

// 获取当前最新的tag
export async function getCurTag() {
  try {
    await $`git fetch --tags -f`
    const { stdout: curTagStdout } = await $`git describe --tags $(git rev-list --tags --max-count=1)`
    const curTag = curTagStdout.trim()
    return curTag
  } catch (err) {
    return ''
  }
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
  let [major, minor, patch] = currentVersion.split('.').map(Number)

  if (branchType === 'release') {
    minor++
    patch = 0
  } else if (branchType === 'hotfix') {
    patch++
  }
  return `${major}.${minor}.${patch}`
}

export async function getVersion(curTag, branchType) {
  if (curTag) {
    const version = await input({
      name: 'version',
      message: `请输入版本号: (当前版本=> ${chalk.greenBright(curTag)})`,
      default: getNewVersion(curTag, branchType),
    })
    return version
  } else {
    const version = await input({
      name: 'version',
      message: `请输入版本号:`,
    })
    return version
  }
}

export function validateVersion(version) {
  const semverRegex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

  return semverRegex.test(version)
}

export async function pullOrigin() {
  const curBranch = await $`git rev-parse --abbrev-ref HEAD`
  // console.log(chalk.greenBright('正在拉取远程develop、master分支最新代码...'))
  await $`git checkout develop`
  await $`git reset --hard origin/develop`
  await $`git checkout master`
  await $`git reset --hard origin/master`
  await $`git checkout ${curBranch}`
  console.log(chalk.greenBright('本地分支develop 和 master 已更新为远程最新代码'))
}

export function getProjectName() {
  return path.basename(process.cwd())
}
