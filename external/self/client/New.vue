<!-- client/index.vue -->
<template>
    <k-layout class="docs-manager">
        <el-row :gutter="20">
            <!-- 左侧分类列表 -->
            <el-col :span="6">
                <k-card>
                    <template #header>
                        <div class="category-header">
                            <span>文档分类</span>
                            <div>
                                <el-button type="primary" size="small" @click="showAddCategory = true">
                                    添加分类
                                </el-button>
                                <!-- 刷新 -->
                                <el-button type="primary" size="small" @click="loadCategories">
                                    刷新
                                </el-button>
                            </div>
                        </div>
                    </template>
                    <el-menu @select="handleCategorySelect" :default-active="currentCategory">
                        <el-menu-item v-for="item in categories" :key="item.id" :index="item.category">
                            {{ item.category }}
                        </el-menu-item>
                    </el-menu>
                </k-card>
            </el-col>

            <!-- 右侧文档列表 -->
            <el-col :span="18">
                <k-card :scrollbar="true" style="height: calc(100vh - 100px)">
                    <template #header>
                        <div class="docs-header">
                            <span>文档列表</span>
                            <el-button type="primary" size="small" @click="handleAddDoc" :disabled="!currentCategory">
                                添加文档
                            </el-button>

                            <el-button type="primary" size="small" @click="rebuild_embeddings(currentCategory)">
                                重构 Embeddings
                            </el-button>

                            <el-button type="primary" size="small" @click="copy_all">
                                复制全部
                            </el-button>

                            <el-button type="primary" size="small" @click="handleRemoveCategory(currentCategory)">
                                删除
                            </el-button>
                        </div>
                    </template>

                    <el-table :data="documents" style="width: 100%">
                        <el-table-column prop="id" label="ID" width="180" />
                        <el-table-column prop="content" label="内容" />
                        <el-table-column label="操作" width="150">
                            <template #default="{ row }">
                                <el-button type="primary" size="small" @click="handleEditDoc(row)">
                                    编辑
                                </el-button>

                                <el-button type="danger" size="small" @click="handleRemoveDoc(row)">
                                    删除
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    <div style="padding: 100px;" </div>
                </k-card>
            </el-col>
        </el-row>

        <!-- 添加分类对话框 -->
        <el-dialog v-model="showAddCategory" title="添加分类" width="30%">
            <el-form :model="categoryForm">
                <el-form-item label="分类名称">
                    <el-input v-model="categoryForm.name" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showAddCategory = false">取消</el-button>
                <el-button type="primary" @click="submitCategory">确定</el-button>
            </template>
        </el-dialog>

        <!-- 文档编辑对话框 -->
        <el-dialog v-model="showDocDialog" :title="editingDoc ? '编辑文档' : '添加文档'" width="50%">
            <el-form :model="docForm">
                <el-form-item label="内容">
                    <el-input v-model="docForm.content" type="textarea" :rows="5" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div v-if="!editingDoc">
                    条数：{{ docForm.content.split('---').length }}
                </div>
                <el-button @click="showDocDialog = false">取消</el-button>
                <el-button type="primary" @click="submitDoc">确定</el-button>
            </template>
        </el-dialog>
    </k-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { send } from '@koishijs/client'
import { ElMessage, ElMessageBox } from 'element-plus'
import { } from "../shared_types"

const categories = ref([])
const documents = ref([])
const currentCategory = ref('')
const showAddCategory = ref(false)
const showDocDialog = ref(false)
const editingDoc = ref(null)

const categoryForm = ref({
    name: ''
})

const docForm = ref({
    content: '',
    metadata: {}
})

// 加载分类列表
const loadCategories = async () => {
    categories.value = await send('docs/get-categories')
}

// 加载文档列表
const loadDocuments = async (category: string) => {
    if (!category) return
    documents.value = await send('docs/get-docs', category)
}

// 选择分类
const handleCategorySelect = (category: string) => {
    console.log(category);

    currentCategory.value = category
    loadDocuments(category)
}

// 提交新分类
const submitCategory = async () => {
    if (!categoryForm.value.name) {
        ElMessage.warning('请输入分类名称')
        return
    }

    const result = await send('docs/add-category', categoryForm.value.name)
    if (result) {
        ElMessage.success('添加成功')
        showAddCategory.value = false
        categoryForm.value.name = ''
        loadCategories()
    } else {
        ElMessage.error('添加失败')
    }
}

const handleRemoveCategory = async (category) => {
    ElMessageBox.confirm('此操作将永久删除该分类, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(async () => {
        const result = await send('docs/remove-category', category)
        if (result) {
            ElMessage.success('删除成功')
            loadCategories()
        } else {
            ElMessage.error('删除失败')
        }
    }).catch(() => {
        ElMessage.info('已取消删除')
    })
}

// 处理添加文档
const handleAddDoc = () => {
    editingDoc.value = null
    docForm.value = {
        content: '',
        metadata: {}
    }
    showDocDialog.value = true
}

// 处理编辑文档
const handleEditDoc = (doc) => {
    editingDoc.value = doc
    docForm.value = {
        content: doc.content,
        metadata: { ...doc }
    }
    showDocDialog.value = true
}

const handleRemoveDoc = async (doc) => {
    ElMessageBox.confirm('此操作将永久删除该文档, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(async () => {
        const result = await send('docs/remove-doc', currentCategory.value, doc.id)
        if (result) {
            ElMessage.success('删除成功')
            loadDocuments(currentCategory.value)
        } else {
            ElMessage.error('删除失败')
        }
    }).catch(() => {
        ElMessage.info('已取消删除')
    })
}

// 提交文档
const submitDoc = async () => {
    if (!docForm.value.content) {
        ElMessage.warning('请输入文档内容')
        return
    }

    const params = {
        category: currentCategory.value,
        content: docForm.value.content,
        metadata: docForm.value.metadata
    }

    let result
    if (editingDoc.value) {
        result = await send('docs/update-doc', {
            ...params,
            id: editingDoc.value.id
        })
    } else {
        console.log(docForm.value.content.split('---'));
        console.log(docForm.value.content);

        for (const text of docForm.value.content.split('---')) {

            if (!text) continue
            result = await send('docs/add-doc', {
                ...params,
                content: text
            })
            if (!result) break
        }
    }

    if (result) {
        ElMessage.success(editingDoc.value ? '更新成功' : '添加成功')
        showDocDialog.value = false
        loadDocuments(currentCategory.value)
    } else {
        ElMessage.error(editingDoc.value ? '更新失败' : '添加失败')
    }
}

const rebuild_embeddings = async (category: string) => {
    const result = await send('docs/rebuild-embeddings', category)
    if (result) {
        ElMessage.success('重建成功')
    } else {
        ElMessage.error('重建失败')
    }
}

const copy_all = async () => {
    // documents
    let res = ""
    for (const doc of documents.value) {
        res += doc.content.trim() + "\n---\n"
    }
    console.log(res);
    // copy
    const input = document.createElement('textarea')
    input.value = res
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    ElMessage.success('复制成功')

}

onMounted(() => {
    loadCategories()
})
</script>

<style scoped>
.docs-manager {
    padding: 20px;
}

.category-header,
.docs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>