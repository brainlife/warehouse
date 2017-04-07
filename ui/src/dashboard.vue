<template>
<div>
    <sidemenu active="/"></sidemenu>
    <div class="off-sidemenu">
		<div class="margin20">
            
            <el-card>
                <p>Show list of all data processing that user is run or has run recently</p>
            </el-card>

            <br>
            <el-card class="box-card">
                <div slot="header" class="clearfix">
                    <span>Card name</span>
                    <el-button size="small" style="float: right;" type="primary">Operation button</el-button>
                </div>
                <p>For each project that user is member of.. * inter project communication</p>
                <div v-for="o in 4" class="text item">
                    {{'List item ' + o }}
                </div>
            </el-card>

            <br>
            <el-row :gutter="20">
                <el-col :span="6">
                    <el-card>
                        <p>TODO. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>
                    </el-card>
                </el-col>
                <el-col :span="6">
                    <el-card>
                        <p>TODO. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>
                    </el-card>
                </el-col>
                <el-col :span="6">
                    <el-card>
                        <p>TODO. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>
                    </el-card>
                </el-col>
                <el-col :span="6">
                    <el-card>
                        <p>TODO. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>
                    </el-card>
                </el-col>
            </el-row>

            <br>
            <el-row :gutter="20">
                <el-col :span="6">
                    <el-card>
                        <p>TODO. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>
                    </el-card>
                </el-col>
                <el-col :span="6">
                    <el-card>
                        <p>Show list of all data processing that user is run or has run recently</p>
                    </el-card>
                </el-col>
                <el-col :span="6">
                    <el-card>
                        <p>Show list of all data processing that user is run or has run recently</p>
                    </el-card>
                </el-col>
                <el-col :span="6">
                    <el-card>
                        <p>Show list of all data processing that user is run or has run recently</p>
                    </el-card>
                </el-col>
            </el-row>


        </div>
    </div><!--off-sidemenu-->
</div>
</template>

<script>

import sidemenu from '@/components/sidemenu'
export default {
  name: 'hello',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  },
  components: { sidemenu },
}
</script>

<style scoped>
</style>
